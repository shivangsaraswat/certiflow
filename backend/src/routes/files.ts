/**
 * File Routes
 * API endpoints for file operations (download, signatures)
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler, AppError } from '../middleware/error-handler.js';
import { uploadSignature } from '../middleware/upload.js';
import { storage } from '../services/storage.service.js';
import { ApiResponse, Signature, StorageType } from '../types/index.js';
import { config } from '../config/index.js';

const router = Router();

// In-memory signature store (in production, use a database)
const signatures: Map<string, Signature> = new Map();
const SIGNATURES_JSON_PATH = path.join(config.storage.root, 'signatures.json');

/**
 * Load signatures from JSON file on startup
 */
export async function loadSignatures(): Promise<void> {
    try {
        const data = await fs.readFile(SIGNATURES_JSON_PATH, 'utf-8');
        const signaturesArray: Signature[] = JSON.parse(data);
        signaturesArray.forEach(s => signatures.set(s.id, s));
        console.log(`✓ Loaded ${signatures.size} signatures`);
    } catch {
        console.log('✓ No existing signatures found, starting fresh');
    }
}

/**
 * Save signatures to JSON file
 */
async function saveSignatures(): Promise<void> {
    const signaturesArray = Array.from(signatures.values());
    await fs.writeFile(SIGNATURES_JSON_PATH, JSON.stringify(signaturesArray, null, 2));
}

/**
 * GET /api/files/download/:type/:filename
 * Download a file from storage
 */
router.get('/download/:type/:filename', asyncHandler(async (req: Request, res: Response) => {
    const { type, filename } = req.params;

    // Validate storage type
    const validTypes: StorageType[] = ['templates', 'signatures', 'generated', 'bulk-zips'];
    if (!validTypes.includes(type as StorageType)) {
        throw new AppError('Invalid file type', 400, 'INVALID_TYPE');
    }

    try {
        const fileBuffer = await storage.get(type as StorageType, filename);

        // Set appropriate content type
        const ext = path.extname(filename).toLowerCase();
        const contentTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.zip': 'application/zip',
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(fileBuffer);
    } catch {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }
}));

/**
 * GET /api/files/view/:type/:filename
 * View a file (inline display, not download)
 */
router.get('/view/:type/:filename', asyncHandler(async (req: Request, res: Response) => {
    const { type, filename } = req.params;

    // Validate storage type
    const validTypes: StorageType[] = ['templates', 'signatures', 'generated'];
    if (!validTypes.includes(type as StorageType)) {
        throw new AppError('Invalid file type', 400, 'INVALID_TYPE');
    }

    try {
        const fileBuffer = await storage.get(type as StorageType, filename);

        // Set appropriate content type
        const ext = path.extname(filename).toLowerCase();
        const contentTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        res.send(fileBuffer);
    } catch {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }
}));

/**
 * POST /api/files/signature
 * Upload a signature image
 */
router.post('/signature', uploadSignature, asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError('Signature file is required', 400, 'FILE_REQUIRED');
    }

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Signature name is required', 400, 'NAME_REQUIRED');
    }

    const id = uuidv4();
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${id}${ext}`;

    // Save the file
    const filepath = await storage.save(req.file.buffer, 'signatures', filename);

    const signature: Signature = {
        id,
        name: name.trim(),
        filename,
        filepath,
        createdAt: new Date().toISOString(),
    };

    signatures.set(id, signature);
    await saveSignatures();

    const response: ApiResponse<Signature> = {
        success: true,
        data: signature,
    };

    res.status(201).json(response);
}));

/**
 * GET /api/files/signatures
 * List all uploaded signatures
 */
router.get('/signatures', asyncHandler(async (req: Request, res: Response) => {
    const signaturesList = Array.from(signatures.values()).map(sig => ({
        ...sig,
        previewUrl: storage.getUrl('signatures', sig.filename),
    }));

    const response: ApiResponse<(Signature & { previewUrl: string })[]> = {
        success: true,
        data: signaturesList,
    };

    res.json(response);
}));

/**
 * DELETE /api/files/signature/:id
 * Delete a signature
 */
router.delete('/signature/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const signature = signatures.get(id);
    if (!signature) {
        throw new AppError('Signature not found', 404, 'SIGNATURE_NOT_FOUND');
    }

    try {
        await storage.delete('signatures', signature.filename);
    } catch {
        // File might not exist, continue anyway
    }

    signatures.delete(id);
    await saveSignatures();

    const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
    };

    res.json(response);
}));

export default router;
