/**
 * Local Storage Provider
 * Implements file storage using the local filesystem
 * Designed to be easily replaceable with cloud storage (S3, GCS) later
 */

import fs from 'fs/promises';
import path from 'path';
import { StorageProvider, StorageType } from '../types/index.js';
import { config } from '../config/index.js';

export class LocalStorageProvider implements StorageProvider {
    private basePaths: Record<StorageType, string>;

    constructor() {
        this.basePaths = {
            templates: config.storage.templates,
            signatures: config.storage.signatures,
            generated: config.storage.generated,
            'bulk-zips': config.storage.bulkZips,
        };
    }

    /**
     * Initialize storage directories
     * Creates all required directories if they don't exist
     */
    async initialize(): Promise<void> {
        for (const dir of Object.values(this.basePaths)) {
            await fs.mkdir(dir, { recursive: true });
        }
        console.log('✓ Storage directories initialized');
    }

    /**
     * Save a file to storage
     */
    async save(file: Buffer, type: StorageType, filename: string): Promise<string> {
        const filepath = this.getPath(type, filename);
        await fs.writeFile(filepath, file);
        return filepath;
    }

    /**
     * Get a file from storage
     */
    async get(type: StorageType, filename: string): Promise<Buffer> {
        const filepath = this.getPath(type, filename);
        return await fs.readFile(filepath);
    }

    /**
     * Delete a file from storage
     */
    async delete(type: StorageType, filename: string): Promise<void> {
        const filepath = this.getPath(type, filename);
        await fs.unlink(filepath);
    }

    /**
     * List all files in a storage type directory
     */
    async list(type: StorageType): Promise<string[]> {
        const dir = this.basePaths[type];
        try {
            return await fs.readdir(dir);
        } catch {
            return [];
        }
    }

    /**
     * Get the download URL for a file
     */
    getUrl(type: StorageType, filename: string): string {
        return `/api/files/download/${type}/${filename}`;
    }

    /**
     * Get the absolute filesystem path for a file
     */
    getPath(type: StorageType, filename: string): string {
        return path.join(this.basePaths[type], filename);
    }

    /**
     * Check if a file exists
     */
    async exists(type: StorageType, filename: string): Promise<boolean> {
        try {
            await fs.access(this.getPath(type, filename));
            return true;
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const storage = new LocalStorageProvider();
