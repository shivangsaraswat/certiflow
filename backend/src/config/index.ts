/**
 * Configuration module for the Certificate Generation Backend
 * Loads environment variables and provides typed configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


// Load environment variables
dotenv.config();

export interface Config {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    storage: StorageConfig;
    certificate: CertificateConfig;
}

export interface StorageConfig {
    root: string;
    templates: string;
    signatures: string;
    generated: string;
    bulkZips: string;
}

export interface CertificateConfig {
    defaultDpi: number;
    defaultFont: string;
    maxBulkBatchSize: number;
}

// Resolve paths relative to the backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../..');

function resolvePath(envPath: string | undefined, defaultPath: string): string {
    const relativePath = envPath || defaultPath;
    return path.resolve(backendDir, relativePath);
}

export const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    storage: {
        root: resolvePath(process.env.STORAGE_ROOT, '../storage'),
        templates: resolvePath(process.env.STORAGE_TEMPLATES, '../storage/templates'),
        signatures: resolvePath(process.env.STORAGE_SIGNATURES, '../storage/signatures'),
        generated: resolvePath(process.env.STORAGE_GENERATED, '../storage/generated'),
        bulkZips: resolvePath(process.env.STORAGE_BULK_ZIPS, '../storage/bulk-zips'),
    },

    certificate: {
        defaultDpi: parseInt(process.env.DEFAULT_DPI || '300', 10),
        defaultFont: process.env.DEFAULT_FONT || 'Poppins',
        maxBulkBatchSize: parseInt(process.env.MAX_BULK_BATCH_SIZE || '50', 10),
    },
};

export default config;
