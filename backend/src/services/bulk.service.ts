/**
 * Bulk Certificate Processing Service
 * Handles batch certificate generation from CSV files
 * Updated for dynamic attributes
 */

import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
    Template,
    CertificateData,
    BulkGenerationResult,
    BulkError,
    CSVRecord,
    GenerationResult
} from '../types/index.js';
import { renderCertificate, generateCertificateId } from '../engine/renderer.js';
import { storage } from './storage.service.js';
import { config } from '../config/index.js';

/**
 * Process a CSV file and generate certificates in batches
 * 
 * @param template - The template to use
 * @param csvPath - Path to the CSV file
 * @param columnMapping - Maps CSV column names to attribute IDs
 */
export async function processBulkGeneration(
    template: Template,
    csvPath: string,
    columnMapping: Record<string, string>
): Promise<BulkGenerationResult> {
    const jobId = uuidv4();
    const batchSize = config.certificate.maxBulkBatchSize;

    // Parse CSV file
    const records = await parseCSVFile(csvPath);

    const results: GenerationResult[] = [];
    const errors: BulkError[] = [];
    const generatedFiles: string[] = [];

    // Process in batches for memory efficiency
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
            batch.map(async (record, batchIndex) => {
                const rowNumber = i + batchIndex + 2; // +2 for header row and 0-indexing

                try {
                    // Map CSV columns to certificate data (attribute IDs)
                    const data = mapRecordToData(record, columnMapping, template);

                    // Generate certificate
                    const pdfBuffer = await renderCertificate(template, data);

                    // Save to storage
                    const certId = generateCertificateId();
                    const filename = `${certId}.pdf`;
                    await storage.save(pdfBuffer, 'generated', filename);

                    generatedFiles.push(filename);

                    return {
                        certificateId: certId,
                        filename,
                        downloadUrl: storage.getUrl('generated', filename),
                    };
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    throw { row: rowNumber, message };
                }
            })
        );

        // Collect results and errors
        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                const reason = result.reason as BulkError;
                errors.push(reason);
            }
        }

        // Allow garbage collection between batches
        await new Promise<void>(resolve => setImmediate(resolve));
    }

    // Create ZIP file with all generated certificates
    const zipFilename = `bulk-${jobId}.zip`;
    await createBulkZip(generatedFiles, zipFilename);

    return {
        jobId,
        totalRequested: records.length,
        successful: results.length,
        failed: errors.length,
        zipUrl: storage.getUrl('bulk-zips', zipFilename),
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Parse a CSV file and return records
 */
async function parseCSVFile(csvPath: string): Promise<CSVRecord[]> {
    return new Promise((resolve, reject) => {
        const records: CSVRecord[] = [];

        createReadStream(csvPath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                trim: true,
            }))
            .on('data', (record: CSVRecord) => {
                records.push(record);
            })
            .on('end', () => resolve(records))
            .on('error', reject);
    });
}

/**
 * Map a CSV record to certificate data using column mapping
 * 
 * @param record - The CSV record
 * @param columnMapping - Maps CSV column names to attribute IDs
 * @param template - The template with attribute definitions
 */
function mapRecordToData(
    record: CSVRecord,
    columnMapping: Record<string, string>,
    template: Template
): CertificateData {
    const data: CertificateData = {};

    // Map each CSV column to its corresponding attribute ID
    for (const [csvColumn, attrId] of Object.entries(columnMapping)) {
        const value = record[csvColumn];
        if (value !== undefined && value !== '') {
            data[attrId] = value;
        }
    }

    // Validate required attributes
    for (const attr of template.attributes) {
        if (attr.required && !data[attr.id]) {
            throw new Error(`Missing required field: ${attr.name}`);
        }
    }

    return data;
}

/**
 * Create a ZIP file containing all generated certificates
 */
async function createBulkZip(
    filenames: string[],
    zipFilename: string
): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const zipPath = storage.getPath('bulk-zips', zipFilename);
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 5 } });

        output.on('close', () => resolve());
        archive.on('error', reject);

        archive.pipe(output);

        // Add each generated certificate to the ZIP
        for (const filename of filenames) {
            const filePath = storage.getPath('generated', filename);
            archive.file(filePath, { name: filename });
        }

        await archive.finalize();
    });
}

/**
 * Get CSV column headers from a file
 */
export async function getCSVHeaders(csvPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        createReadStream(csvPath)
            .pipe(parse({
                columns: false,
                to_line: 1,
            }))
            .on('data', (row: string[]) => {
                resolve(row);
            })
            .on('error', reject);
    });
}
