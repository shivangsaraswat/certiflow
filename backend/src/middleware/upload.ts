/**
 * File Upload Middleware
 * Configures multer for handling file uploads
 * Updated for PDF-only template uploads
 */

import multer from 'multer';
import path from 'path';
import { AppError } from './error-handler.js';

// Allowed file types
const TEMPLATE_TYPES = ['.pdf'];           // PDF only for templates
const SIGNATURE_TYPES = ['.png', '.jpg', '.jpeg'];
const CSV_TYPES = ['.csv'];

// Memory storage for processing files before saving
const memoryStorage = multer.memoryStorage();

// File filter for templates (PDF only)
function templateFileFilter(
    req: Express.Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
): void {
    const ext = path.extname(file.originalname).toLowerCase();
    if (TEMPLATE_TYPES.includes(ext)) {
        callback(null, true);
    } else {
        callback(new AppError(
            'Invalid file type. Only PDF files are supported for templates.',
            400,
            'INVALID_FILE_TYPE'
        ));
    }
}

// File filter for signatures
function signatureFileFilter(
    req: Express.Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
): void {
    const ext = path.extname(file.originalname).toLowerCase();
    if (SIGNATURE_TYPES.includes(ext)) {
        callback(null, true);
    } else {
        callback(new AppError(
            `Invalid file type. Allowed: ${SIGNATURE_TYPES.join(', ')}`,
            400,
            'INVALID_FILE_TYPE'
        ));
    }
}

// File filter for CSV files
function csvFileFilter(
    req: Express.Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
): void {
    const ext = path.extname(file.originalname).toLowerCase();
    if (CSV_TYPES.includes(ext)) {
        callback(null, true);
    } else {
        callback(new AppError(
            'Invalid file type. Only CSV files are allowed.',
            400,
            'INVALID_FILE_TYPE'
        ));
    }
}

// Template upload middleware (PDF only)
export const uploadTemplate = multer({
    storage: memoryStorage,
    fileFilter: templateFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max for PDF templates
    },
}).single('template');

// Signature upload middleware
export const uploadSignature = multer({
    storage: memoryStorage,
    fileFilter: signatureFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max for signatures
    },
}).single('signature');

// CSV upload middleware
export const uploadCSV = multer({
    storage: memoryStorage,
    fileFilter: csvFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max for CSV
    },
}).single('csv');
