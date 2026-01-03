
import { Router } from 'express';
import multer from 'multer';
import { getTemplateById } from '../services/template.service.js';
import { storage } from '../services/storage.service.js';
import {
    createCertificateRecord,
    getCertificateByCode
} from '../services/certificate.service.js';
import {
    processBulkGeneration,
    getCSVHeaders,
    getBulkJobById
} from '../services/bulk.service.js';
import { renderCertificate, generateCertificateId } from '../engine/renderer.js';
import { uploadConfig } from '../middleware/upload.js';
import { config } from '../config/index.js';
import path from 'path';
import fs from 'fs';
import {
    ApiResponse,
    GenerationResult,
    BulkGenerationResult,
    CertificateData
} from '../types/index.js';

const router = Router();
const upload = multer(uploadConfig);

// Generate single certificate
router.post('/single', async (req, res) => {
    try {
        const { templateId, data, recipientName } = req.body;

        const template = await getTemplateById(templateId);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        // Generate Code & Filename
        const certificateCode = generateCertificateId();
        const filename = `${certificateCode}.pdf`;

        // Render PDF (Buffer)
        const pdfBuffer = await renderCertificate(template, data as CertificateData);

        // Upload to ImageKit
        // We pass a path like string to trigger folder logic in uploadBuffer, e.g. "generated/Code.pdf"
        const uploadPath = `generated/${filename}`;
        const uploadResult = await storage.uploadBuffer(pdfBuffer, uploadPath);

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Save Record
        await createCertificateRecord({
            certificateCode,
            templateId,
            recipientName: recipientName || 'Unknown Recipient',
            data,
            filename,
            filepath: filename, // Legacy: stored as filename
            fileUrl: uploadResult.url,
            fileId: uploadResult.id,
            generationMode: 'single',
            bulkJobId: null,
            userId: userId
        });

        const response: ApiResponse<GenerationResult> = {
            success: true,
            data: {
                certificateId: certificateCode,
                filename,
                downloadUrl: `/api/files/download/generated/${filename}` // Keeps existing frontend flow or we can pass uploadResult.url directly?
                // Frontend expects downloadUrl. Our files route will redirect to ImageKit.
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Generation Validation Error:', error);
        res.status(400).json({ success: false, error: (error as Error).message });
    }
});

// Bulk Generation - Preview CSV headers
router.post('/bulk/preview', upload.single('csv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
        }

        const headers = await getCSVHeaders(req.file.path);

        // Cleanup temp file
        fs.unlink(req.file.path, () => { });

        res.json({
            success: true,
            data: { headers }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to process CSV' });
    }
});

// Bulk Generation - Main endpoint (handles both CSV and Data Vault)
router.post('/bulk', upload.single('csv'), async (req, res) => {
    try {
        const { templateId, columnMapping: mappingStr, sheetId, groupId } = req.body;

        if (!templateId) {
            return res.status(400).json({ success: false, error: 'Template ID is required' });
        }

        let columnMapping: Record<string, string>;
        try {
            columnMapping = JSON.parse(mappingStr);
        } catch {
            return res.status(400).json({ success: false, error: 'Invalid column mapping' });
        }

        let source: any;

        // Determine source type
        if (sheetId) {
            source = { type: 'sheet', id: sheetId };
        } else if (req.file) {
            source = { type: 'csv', path: req.file.path };
        } else {
            return res.status(400).json({ success: false, error: 'Either CSV file or sheetId is required' });
        }

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Start bulk generation (with optional groupId)
        const result = await processBulkGeneration(templateId, source, columnMapping, groupId || undefined, userId);

        // For immediate response, we return basic info
        // The actual processing happens async, and we can poll the job
        const job = await getBulkJobById(result);

        // Wait a bit for quick jobs to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        const updatedJob = await getBulkJobById(result);

        if (updatedJob && updatedJob.status === 'completed') {
            res.json({
                success: true,
                data: {
                    jobId: result,
                    totalRequested: updatedJob.totalRecords,
                    successful: updatedJob.successful,
                    failed: updatedJob.failed,
                    errors: updatedJob.errors?.map((e: any) => ({ row: e.row, message: e.error })) || [],
                    zipUrl: updatedJob.zipFileUrl || `/api/files/download/bulk-zips/${updatedJob.zipFilename}`
                }
            });
        } else if (updatedJob && updatedJob.status === 'failed') {
            res.json({
                success: false,
                error: 'Bulk generation failed',
                data: {
                    jobId: result,
                    totalRequested: updatedJob.totalRecords,
                    successful: updatedJob.successful,
                    failed: updatedJob.failed,
                    errors: updatedJob.errors?.map((e: any) => ({ row: e.row, message: e.error })) || []
                }
            });
        } else {
            // Still processing - return job ID for polling
            res.json({
                success: true,
                data: {
                    jobId: result,
                    status: 'processing',
                    message: 'Bulk generation started. Poll /api/generate/bulk/status/:jobId for updates.'
                }
            });
        }
    } catch (error) {
        console.error('Bulk Generation Error:', error);
        res.status(500).json({ success: false, error: (error as Error).message || 'Failed to start bulk generation' });
    }
});


// Get Bulk Job Status
router.get('/bulk/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const job = await getBulkJobById(id);

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        if (job.userId !== userId) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        res.json({
            success: true,
            data: {
                jobId: job.id,
                status: job.status,
                totalRequested: job.totalRecords,
                successful: job.successful,
                failed: job.failed,
                errors: job.errors?.map((e: any) => ({ row: e.row, message: e.error })) || [],
                zipUrl: job.zipFileUrl || (job.zipFilename ? `/api/files/download/bulk-zips/${job.zipFilename}` : null)
            }
        });
    } catch (error) {
        console.error('Bulk Status Error:', error);
        res.status(500).json({ success: false, error: 'Failed to check job status' });
    }
});

// Legacy endpoints - keeping for backward compatibility
// Bulk Generation - Step 1: Upload CSV and Get Headers
router.post('/bulk/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
        }

        // Return headers for mapping
        const headers = await getCSVHeaders(req.file.path);

        res.json({
            success: true,
            data: {
                filename: req.file.filename,
                filepath: req.file.path,
                headers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to process CSV' });
    }
});

// Bulk Generation - Step 2: Start Job
router.post('/bulk/start', async (req, res) => {
    try {
        const { templateId, csvFilepath, sheetId, mapping } = req.body;

        if (!templateId || (!csvFilepath && !sheetId) || !mapping) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        let source: any;
        if (sheetId) {
            source = { type: 'sheet', id: sheetId };
        } else {
            source = { type: 'csv', path: csvFilepath };
        }

        const jobId = await processBulkGeneration(templateId, source, mapping);

        const response: ApiResponse<BulkGenerationResult> = {
            success: true,
            data: {
                jobId,
                message: 'Bulk generation started'
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Bulk Start Error:', error);
        res.status(500).json({ success: false, error: 'Failed to start bulk generation' });
    }
});

export default router;
