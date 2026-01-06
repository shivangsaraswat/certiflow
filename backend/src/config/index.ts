/**
 * Configuration module for the Certificate Generation Backend
 * Loads environment variables and provides typed configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    frontendUrls: string[]; // Support multiple origins
    imagekit: {
        publicKey: string;
        privateKey: string;
        urlEndpoint: string;
    };
    certificate: CertificateConfig;
}

export interface CertificateConfig {
    defaultDpi: number;
    defaultFont: string;
    maxBulkBatchSize: number;
}

// Parse comma-separated frontend URLs for CORS
const parseFrontendUrls = (): string[] => {
    const urls = process.env.FRONTEND_URL || 'http://localhost:3000';
    return urls.split(',').map(url => url.trim()).filter(Boolean);
};

export const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:3000',
    frontendUrls: parseFrontendUrls(),

    imagekit: {
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    },

    certificate: {
        defaultDpi: parseInt(process.env.DEFAULT_DPI || '300'),
        defaultFont: process.env.DEFAULT_FONT || 'Poppins',
        maxBulkBatchSize: parseInt(process.env.MAX_BULK_BATCH_SIZE || '50'),
    },
};
