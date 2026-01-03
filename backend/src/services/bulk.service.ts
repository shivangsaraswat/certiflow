
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import { db } from '../lib/db.js';
import { bulkJobs, certificates, spreadsheetData } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

import { config } from '../config/index.js';
import { renderCertificate, generateCertificateCode, generateCertificateId } from '../engine/renderer.js';
import { storage } from './storage.service.js';
import { getTemplateById } from './template.service.js';
import type { Template } from '../types/index.js';
import { createCertificateRecord } from './certificate.service.js';

export interface BulkJobRecord {
    id: string;
    templateId: string;
    sourceType: string;
    totalRecords: number;
    successful: number;
    failed: number;
    status: string;
    zipFilename: string | null;
    zipFilepath: string | null;
    errors: BulkError[] | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface BulkError {
    row: number;
    error: string;
    data?: any;
}

interface CSVRecord {
    [key: string]: string;
}

interface CertificateData {
    [key: string]: string;
}

export async function getCSVHeaders(filepath: string): Promise<string[]> {
    const parser = fs.createReadStream(filepath).pipe(parse({
        to: 1, // Only read first line
        trim: true
    }));

    for await (const record of parser) {
        return record;
    }
    return [];
}

export async function processBulkGeneration(
    templateId: string,
    source: { type: 'csv', path: string } | { type: 'sheet', id: string },
    columnMapping: Record<string, string>,
    groupId?: string,
    userId?: string
): Promise<string> {
    const jobId = uuidv4();
    const template = await getTemplateById(templateId);

    if (!template) {
        throw new Error('Template not found');
    }

    let records: CSVRecord[] = [];
    let sourceType = source.type;

    if (source.type === 'csv') {
        const parser = fs.createReadStream(source.path).pipe(parse({
            columns: true,
            skip_empty_lines: true,
            trim: true
        }));
        for await (const record of parser) {
            records.push(record);
        }
    } else if (source.type === 'sheet') {
        // Fetch sheet content
        const sheetData = await db.select().from(spreadsheetData).where(eq(spreadsheetData.spreadsheetId, source.id));
        if (!sheetData[0] || !sheetData[0].content) {
            throw new Error('Spreadsheet data not found');
        }

        // Parse FortuneSheet data to Records
        // FortuneSheet content is array of sheets. We take the first one.
        const content = sheetData[0].content as any[];
        const sheet = content[0]; // Assume first sheet

        if (!sheet) {
            throw new Error('Sheet is empty');
        }

        // Build a grid from either celldata or data format
        const grid: Record<number, Record<number, string>> = {};
        let maxRow = 0;
        let maxCol = 0;

        // Handle celldata format (sparse array with {r, c, v} objects)
        if (sheet.celldata && Array.isArray(sheet.celldata) && sheet.celldata.length > 0) {
            for (const cell of sheet.celldata) {
                if (!grid[cell.r]) grid[cell.r] = {};
                const val = cell.v?.m || cell.v?.v || (typeof cell.v === 'string' ? cell.v : '');
                grid[cell.r][cell.c] = String(val);
                if (cell.r > maxRow) maxRow = cell.r;
                if (cell.c > maxCol) maxCol = cell.c;
            }
        }
        // Handle data format (2D array)
        else if (sheet.data && Array.isArray(sheet.data) && sheet.data.length > 0) {
            // For 2D array, maxRow is simply the array length - 1
            maxRow = sheet.data.length - 1;

            for (let r = 0; r < sheet.data.length; r++) {
                const row = sheet.data[r];
                if (!row || !Array.isArray(row)) continue;
                if (!grid[r]) grid[r] = {};

                for (let c = 0; c < row.length; c++) {
                    const cell = row[c];
                    if (cell !== null && cell !== undefined && typeof cell === 'object') {
                        const val = cell?.m || cell?.v || '';
                        if (val) {
                            grid[r][c] = String(val);
                            if (c > maxCol) maxCol = c;
                        }
                    } else if (typeof cell === 'string' && cell) {
                        grid[r][c] = cell;
                        if (c > maxCol) maxCol = c;
                    }
                }
            }
        } else {
            throw new Error('Sheet has no data in recognized format');
        }

        console.log(`[Bulk] Grid built. maxRow=${maxRow}, maxCol=${maxCol}`);
        console.log(`[Bulk] Headers from row 0:`, grid[0]);

        // Row 0 is Headers
        const headers: Record<number, string> = {};
        if (grid[0]) {
            Object.entries(grid[0]).forEach(([c, val]) => {
                headers[Number(c)] = val;
            });
        }

        console.log(`[Bulk] Parsed headers:`, headers);

        // Rows 1+ are Data
        for (let i = 1; i <= maxRow; i++) {
            if (!grid[i]) continue;
            const record: CSVRecord = {};
            let hasData = false;

            // Iterate known headers
            Object.entries(headers).forEach(([c, headerName]) => {
                const val = grid[i][Number(c)];
                if (val) {
                    record[headerName] = val;
                    hasData = true;
                }
            });

            if (hasData) {
                records.push(record);
            }
        }

        console.log(`[Bulk] Total records extracted: ${records.length}`);
    }

    // 2. Create Job Record
    const newJob = {
        id: jobId,
        templateId,
        groupId: groupId || null,
        sourceType: sourceType,
        totalRecords: records.length,
        status: 'processing',
        successful: 0,
        failed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        errors: [] as BulkError[],
        userId: userId || null
    };

    await db.insert(bulkJobs).values(newJob as any);

    // 3. Start async processing
    processBatch(jobId, template, records, columnMapping, groupId, userId).catch(err => {
        console.error(`Bulk job ${jobId} crashed:`, err);
        updateJobStatus(jobId, 'failed');
    });

    return jobId;
}

async function processBatch(
    jobId: string,
    template: Template,
    records: CSVRecord[],
    columnMapping: Record<string, string>,
    groupId?: string,
    userId?: string
) {
    // Only use temp dir for ZIP creation
    const tempDir = path.join(os.tmpdir(), 'certif-bulk');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const zipFilename = `certificates-${jobId}.zip`;
    const zipFilepath = path.join(tempDir, zipFilename);
    const output = fs.createWriteStream(zipFilepath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    const errors: BulkError[] = [];
    let successful = 0;
    let failed = 0;

    for (const [index, record] of records.entries()) {
        try {
            const certData: CertificateData = {};

            // Map data from source columns to template attributes
            // columnMapping is { sourceColumn: attrId }
            for (const [sourceColumn, attrId] of Object.entries(columnMapping)) {
                // Find attribute by ID (frontend sends attribute IDs, not names)
                const attr = template.attributes.find(a => a.id === attrId);
                if (attr) {
                    certData[attr.id] = record[sourceColumn] || '';
                }
            }

            console.log(`[Bulk] Row ${index + 1} certData:`, JSON.stringify(certData));

            // Try to find email in the record (look for common email field names)
            let recipientEmail: string | undefined;
            const emailKeys = ['email', 'Email', 'EMAIL', 'e-mail', 'E-mail', 'email_address', 'email address'];
            for (const key of emailKeys) {
                if (record[key]) {
                    recipientEmail = record[key];
                    break;
                }
            }
            // Also check if any column was mapped to email
            for (const [sourceCol, attrId] of Object.entries(columnMapping)) {
                const attr = template.attributes.find(a => a.id === attrId);
                if (attr && attr.name.toLowerCase().includes('email')) {
                    recipientEmail = record[sourceCol] || recipientEmail;
                    break;
                }
            }

            // Generate Certificate ID using template code and email
            const certId = generateCertificateCode(template.code, recipientEmail);
            const filename = `${certId}.pdf`;

            // Render to Buffer (No local file save)
            const pdfBuffer = await renderCertificate(template, certData);

            // Upload PDF to ImageKit
            const uploadPath = `generated/${filename}`;
            const uploadResult = await storage.uploadBuffer(pdfBuffer, uploadPath);

            // Add Buffer to ZIP stream
            archive.append(pdfBuffer, { name: filename });

            // Track in Database - find recipient name from first text attribute
            const recipientName = certData[template.attributes[0]?.id] || 'Unknown';

            await createCertificateRecord({
                certificateCode: certId,
                templateId: template.id,
                groupId: groupId || null,
                recipientName: recipientName,
                recipientEmail: recipientEmail || null,
                data: certData,
                filename: filename,
                filepath: filename, // Legacy
                fileUrl: uploadResult.url,
                fileId: uploadResult.id,
                generationMode: 'bulk',
                bulkJobId: jobId,
                userId: userId || null
            });

            successful++;

            // Update progress periodically
            if (index % 10 === 0) {
                await updateJobProgress(jobId, successful, failed);
            }

        } catch (error: any) {
            console.error(`Error processing row ${index}:`, error);
            failed++;
            errors.push({
                row: index + 1,
                error: error.message || 'Unknown error',
                data: record
            });
            await updateJobProgress(jobId, successful, failed, errors);
        }
    }

    // Finalize ZIP
    await archive.finalize();

    // Wait for stream to close
    await new Promise<void>((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
    });

    // Upload ZIP to ImageKit
    let zipUrl = '';
    let zipId = '';

    if (successful > 0) {
        try {
            // Read temp zip
            const zipBuffer = fs.readFileSync(zipFilepath);
            const zipUploadPath = `bulk-zips/${zipFilename}`;
            const zipResult = await storage.uploadBuffer(zipBuffer, zipUploadPath);
            zipUrl = zipResult.url;
            zipId = zipResult.id;
        } catch (e) {
            console.error('Failed to upload ZIP:', e);
            // Don't fail the job, but log it?
        }
    }

    // Cleanup Temp Zip
    if (fs.existsSync(zipFilepath)) {
        fs.unlinkSync(zipFilepath);
    }

    // Final Update
    await db.update(bulkJobs)
        .set({
            status: failed === records.length ? 'failed' : 'completed',
            successful,
            failed,
            zipFilename,
            zipFilepath: zipFilename, // Legacy
            zipFileUrl: zipUrl,
            zipFileId: zipId,
            errors: errors as any,
            updatedAt: new Date()
        })
        .where(eq(bulkJobs.id, jobId));
}

async function updateJobProgress(id: string, successful: number, failed: number, errors?: BulkError[]) {
    const updateData: any = { successful, failed, updatedAt: new Date() };
    if (errors) updateData.errors = errors;

    await db.update(bulkJobs)
        .set(updateData)
        .where(eq(bulkJobs.id, id));
}

async function updateJobStatus(id: string, status: string) {
    await db.update(bulkJobs)
        .set({ status, updatedAt: new Date() })
        .where(eq(bulkJobs.id, id));
}

async function createZip(sourceDir: string, files: string[], zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        files.forEach(file => {
            archive.file(path.join(sourceDir, file), { name: file });
        });

        archive.finalize();
    });
}

export async function getBulkJobs(limit = 10, offset = 0, userId?: string) {
    let query = db.select().from(bulkJobs).orderBy(desc(bulkJobs.createdAt)).limit(limit).offset(offset);

    if (userId) {
        // @ts-ignore - complex query builder typing
        query = db.select().from(bulkJobs).where(eq(bulkJobs.userId, userId)).orderBy(desc(bulkJobs.createdAt)).limit(limit).offset(offset);
    }

    const jobs = await query;

    let countQuery = db.select({ id: bulkJobs.id }).from(bulkJobs);
    if (userId) {
        // @ts-ignore
        countQuery = db.select({ id: bulkJobs.id }).from(bulkJobs).where(eq(bulkJobs.userId, userId));
    }
    const all = await countQuery;

    return {
        jobs: jobs.map(j => ({
            ...j,
            errors: j.errors as BulkError[] | null,
        })),
        total: all.length
    };
}

export async function getBulkJobById(id: string) {
    const result = await db.select().from(bulkJobs).where(eq(bulkJobs.id, id));
    if (!result[0]) return null;

    return {
        ...result[0],
        errors: result[0].errors as BulkError[] | null
    };
}
