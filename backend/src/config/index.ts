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
    frontendUrlAlt: string;
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

export const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    frontendUrlAlt: 'http://localhost:3000',

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
