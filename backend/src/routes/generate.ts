
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
    getCSVHeaders
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
            bulkJobId: null
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
