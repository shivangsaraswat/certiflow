/**
 * Certificate Generation Routes
 * API endpoints for single and bulk certificate generation
 * Updated for dynamic attributes
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { asyncHandler, AppError } from '../middleware/error-handler.js';
import { uploadCSV } from '../middleware/upload.js';
import { getTemplateById } from '../services/template.service.js';
import { renderCertificate, generateCertificateId } from '../engine/renderer.js';
import { processBulkGeneration, getCSVHeaders } from '../services/bulk.service.js';
import { storage } from '../services/storage.service.js';
import {
    ApiResponse,
    GenerationResult,
    BulkGenerationResult,
    CertificateData
} from '../types/index.js';

const router = Router();

/**
 * POST /api/generate/single
 * Generate a single certificate
 * Data keys should match the attribute IDs defined in the template
 */
router.post('/single', asyncHandler(async (req: Request, res: Response) => {
    const { templateId, data } = req.body;

    // Validate request
    if (!templateId) {
        throw new AppError('Template ID is required', 400, 'TEMPLATE_ID_REQUIRED');
    }

    if (!data || typeof data !== 'object') {
        throw new AppError('Certificate data is required', 400, 'DATA_REQUIRED');
    }

    // Get template
    const template = getTemplateById(templateId);
    if (!template) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    // Validate required attributes
    const missingRequired = template.attributes
        .filter(attr => attr.required && !data[attr.id])
        .map(attr => attr.name);

    if (missingRequired.length > 0) {
        throw new AppError(
            `Missing required fields: ${missingRequired.join(', ')}`,
            400,
            'MISSING_REQUIRED_FIELDS'
        );
    }

    // Prepare certificate data
    const certificateId = generateCertificateId();
    const certificateData: CertificateData = {
        ...data,
        _certificateId: certificateId,  // Internal use
    };

    // Generate certificate
    const pdfBuffer = await renderCertificate(template, certificateData);

    // Save to storage
    const filename = `${certificateId}.pdf`;
    await storage.save(pdfBuffer, 'generated', filename);

    const result: GenerationResult = {
        certificateId,
        filename,
        downloadUrl: storage.getUrl('generated', filename),
    };

    const response: ApiResponse<GenerationResult> = {
        success: true,
        data: result,
    };

    res.status(201).json(response);
}));

/**
 * POST /api/generate/bulk
 * Generate certificates in bulk from a CSV file
 */
router.post('/bulk', uploadCSV, asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError('CSV file is required', 400, 'FILE_REQUIRED');
    }

    const { templateId, columnMapping } = req.body;

    // Validate request
    if (!templateId) {
        throw new AppError('Template ID is required', 400, 'TEMPLATE_ID_REQUIRED');
    }

    // Parse column mapping from JSON string if needed
    let parsedMapping: Record<string, string>;
    try {
        parsedMapping = typeof columnMapping === 'string'
            ? JSON.parse(columnMapping)
            : columnMapping;
    } catch {
        throw new AppError('Invalid column mapping format', 400, 'INVALID_MAPPING');
    }

    if (!parsedMapping || typeof parsedMapping !== 'object') {
        throw new AppError('Column mapping is required', 400, 'MAPPING_REQUIRED');
    }

    // Get template
    const template = getTemplateById(templateId);
    if (!template) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    // Save CSV to temp file
    const tempCsvPath = path.join(os.tmpdir(), `bulk-${uuidv4()}.csv`);
    await fs.writeFile(tempCsvPath, req.file.buffer);

    try {
        // Process bulk generation
        const result = await processBulkGeneration(template, tempCsvPath, parsedMapping);

        const response: ApiResponse<BulkGenerationResult> = {
            success: true,
            data: result,
        };

        res.status(201).json(response);
    } finally {
        // Clean up temp file
        await fs.unlink(tempCsvPath).catch(() => { });
    }
}));

/**
 * POST /api/generate/bulk/preview
 * Get CSV headers for column mapping
 */
router.post('/bulk/preview', uploadCSV, asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError('CSV file is required', 400, 'FILE_REQUIRED');
    }

    // Save CSV to temp file
    const tempCsvPath = path.join(os.tmpdir(), `preview-${uuidv4()}.csv`);
    await fs.writeFile(tempCsvPath, req.file.buffer);

    try {
        const headers = await getCSVHeaders(tempCsvPath);

        const response: ApiResponse<{ headers: string[] }> = {
            success: true,
            data: { headers },
        };

        res.json(response);
    } finally {
        // Clean up temp file
        await fs.unlink(tempCsvPath).catch(() => { });
    }
}));

/**
 * POST /api/generate/download
 * Download a generated certificate (returns PDF directly)
 */
router.get('/download/:filename', asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;

    try {
        const pdfBuffer = await storage.get('generated', filename);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    } catch {
        throw new AppError('Certificate not found', 404, 'CERTIFICATE_NOT_FOUND');
    }
}));

export default router;
