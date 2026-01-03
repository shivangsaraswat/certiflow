
import { Router } from 'express';
import multer from 'multer';
import { storage } from '../services/storage.service.js';
import { ApiResponse, Signature, StorageType } from '../types/index.js';
import { uploadConfig } from '../middleware/upload.js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import path from 'path';

const router = Router();
const upload = multer(uploadConfig);

export const loadSignatures = async () => {
    // No-op or fetch from storage if needed. 
    // ImageKit doesn't need "loading" to cache.
    // We can list files dynamically.
};

// List signatures
router.get('/signatures', async (req, res) => {
    try {
        const files = await storage.listFiles('signatures');
        // Map names to Signature objects
        // We only have names.
        const signatures = files.map(name => ({
            id: name,
            name: name,
            filename: name,
            filepath: name, // Placeholder
            uploadDate: new Date()
        }));
        res.json({ success: true, data: signatures });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed to list signatures' });
    }
});

// Upload signature
router.post('/signatures', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // storage.saveFile now uploads to ImageKit and returns {id, name, url}
        const result = await storage.saveFile(req.file, 'signatures');

        const newSig: Signature = {
            id: result.id,
            name: result.name,
            filename: result.name,
            uploadDate: new Date(),
            filepath: result.url
        };

        res.json({ success: true, data: newSig });
    } catch (error) {
        console.error('Upload signature error:', error);
        res.status(500).json({ success: false, error: 'Failed to upload signature' });
    }
});

// Delete signature
router.delete('/signatures/:filename', async (req, res) => {
    try {
        const success = await storage.deleteFile('signatures', req.params.filename);
        if (success) {
            res.json({ success: true, message: 'Signature deleted' });
        } else {
            res.status(404).json({ success: false, error: 'Signature not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete signature' });
    }
});

// Download file (Generic)
router.get('/download/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        // Validate type
        if (!['templates', 'generated', 'signatures', 'bulk-zips'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid file type' });
        }

        // Redirect to ImageKit public URL?
        // Or proxy? Proxy allows auth control.
        // User asked for "file storage in neon" ... nope, ImageKit.
        // "save their URL into database and from their use it on a real time"
        // If we use URL, we can just redirect or return URL in API.
        // This download endpoint was used for serving local files.
        // Let's redirect to the signed/public URL.

        const url = storage.getPublicUrl(type as StorageType, filename);
        res.redirect(url);
    } catch (error) {
        res.status(404).json({ success: false, error: 'File not found' });
    }
});

// View file (same as download, but semantically for inline viewing)
router.get('/view/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        // Validate type
        if (!['templates', 'generated', 'signatures', 'bulk-zips'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid file type' });
        }
        const url = storage.getPublicUrl(type as StorageType, filename);
        res.redirect(url);
    } catch (error) {
        res.status(404).json({ success: false, error: 'File not found' });
    }
});

export default router;
