
import ImageKit from 'imagekit';
import { config } from '../config/index.js';
import { StorageProvider, StorageType } from '../types/index.js';
import fs from 'fs';
import path from 'path';

export class ImageKitStorageProvider implements StorageProvider {
    private imagekit: ImageKit | undefined;

    constructor() {
        if (config.imagekit.publicKey && config.imagekit.privateKey && config.imagekit.urlEndpoint) {
            this.imagekit = new ImageKit({
                publicKey: config.imagekit.publicKey,
                privateKey: config.imagekit.privateKey,
                urlEndpoint: config.imagekit.urlEndpoint,
            });
            console.log('✓ ImageKit Storage Provider Initialized');
        } else {
            console.warn('⚠️  ImageKit credentials missing. Storage operations will fail until configured.');
        }
    }

    async initialize(): Promise<void> {
        // Already done in constructor or lazy load
    }

    /**
     * Upload a file from Multer to ImageKit
     * @param file The multer file object
     * @param type Storage type (folder mapping)
     * @param filename Optional filename override
     */
    async saveFile(file: Express.Multer.File, type: StorageType, filename?: string): Promise<{ id: string, name: string, url: string }> {
        if (!this.imagekit) throw new Error('ImageKit not configured');

        const folder = this.getFolder(type);
        const fileName = filename || file.originalname;

        // Read file buffer (Multer diskStorage might have it at path, memoryStorage at buffer)
        // Our middleware uses diskStorage currently (to templates dir).
        // So we read from file.path
        let buffer: Buffer;
        if (file.buffer) {
            buffer = file.buffer;
        } else if (file.path) {
            buffer = fs.readFileSync(file.path);
        } else {
            throw new Error('File content missing');
        }

        const response = await this.imagekit.upload({
            file: buffer,
            fileName: fileName,
            folder: folder,
            useUniqueFileName: false,
        });

        // Cleanup local temp file if it exists
        if (file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (e) {
                console.warn('Failed to delete temp file:', file.path);
            }
        }

        return {
            id: response.fileId,
            name: response.name,
            url: response.url
        };
    }

    /**
     * Upload raw buffer to ImageKit
     */
    async uploadBuffer(buffer: Buffer, filepath: string): Promise<{ id: string, name: string, url: string }> {
        if (!this.imagekit) throw new Error('ImageKit not configured');

        const fileName = path.basename(filepath);

        let folder = '/generated';
        if (filepath.includes('/templates/')) folder = '/templates';
        else if (filepath.includes('/generated/')) folder = '/generated';
        else if (filepath.includes('/signatures/')) folder = '/signatures';
        else if (filepath.includes('/bulk-zips/')) folder = '/bulk-zips';

        const response = await this.imagekit.upload({
            file: buffer,
            fileName: fileName,
            folder: folder,
            useUniqueFileName: false,
        });

        return {
            id: response.fileId,
            name: response.name,
            url: response.url
        };
    }

    /**
     * Get file content (Buffer)
     * For PDF manipulation, we need the actual buffer.
     * We can fetch it from the URL.
     */
    async getFile(type: StorageType, filename: string): Promise<Buffer> {
        if (!this.imagekit) throw new Error('ImageKit not configured');

        // Let's try to find the file by name + folder.
        const folder = this.getFolder(type);

        const files = await this.imagekit.listFiles({
            searchQuery: `name = "${filename}"`,
            path: folder,
            limit: 1
        });

        if (files.length === 0) {
            throw new Error(`File not found in storage: ${filename}`);
        }

        const fileStart = files[0] as any; // Cast to bypass FileObject | FolderObject union issue
        const url = fileStart.url;

        // Fetch the content
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async get(type: StorageType, filename: string): Promise<Buffer> {
        return this.getFile(type, filename);
    }

    async deleteFile(type: StorageType, filename: string): Promise<boolean> {
        if (!this.imagekit) return false;

        try {
            const folder = this.getFolder(type);
            const files = await this.imagekit.listFiles({
                searchQuery: `name = "${filename}"`,
                path: folder,
                limit: 1
            });

            if (files.length > 0) {
                await this.imagekit.deleteFile((files[0] as any).fileId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Delete file failed:', error);
            return false;
        }
    }

    async listFiles(type: StorageType): Promise<string[]> {
        if (!this.imagekit) return [];

        const folder = this.getFolder(type);
        const files = await this.imagekit.listFiles({
            path: folder
        });

        return files.map(f => f.name);
    }

    getPublicUrl(type: StorageType, filename: string): string {
        const folder = this.getFolder(type);
        const folderPath = folder.startsWith('/') ? folder : `/${folder}`;
        return `${config.imagekit.urlEndpoint}${folderPath}/${filename}`;
    }

    private getFolder(type: StorageType): string {
        switch (type) {
            case 'templates': return '/templates';
            case 'generated': return '/generated';
            case 'signatures': return '/signatures';
            case 'bulk-zips': return '/bulk-zips';
            default: return '/misc';
        }
    }
}

export const storage = new ImageKitStorageProvider();
