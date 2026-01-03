
import { Router } from 'express';
import multer from 'multer';
import { storage } from '../services/storage.service.js';
import { ApiResponse, Signature, StorageType } from '../types/index.js';
import { uploadConfig } from '../middleware/upload.js';
import { db } from '../lib/db.js';
import { signatures } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
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
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const files = await db
            .select()
            .from(signatures)
            .where(eq(signatures.userId, userId));

        res.json({ success: true, data: files });
    } catch (e) {
        console.error('List signatures error:', e);
        res.status(500).json({ success: false, error: 'Failed to list signatures' });
    }
});

// Upload signature
router.post('/signatures', upload.single('file'), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // storage.saveFile now uploads to ImageKit and returns {id, name, url}
        const result = await storage.saveFile(req.file, 'signatures');

        const newSig = {
            id: result.id, // Using ImageKit File ID as PK? Or Generating UUID? 
            // Schema has `id` as PK. `fileId` is optional.
            // Let's use UUID for PK and store ImageKit ID in `fileId`.
            // Wait, previous code used `result.id` as ID.
            // I'll make PK a UUID.
            name: req.file.originalname,
            filename: result.name,
            fileUrl: result.url,
            fileId: result.id,
            userId: userId,
            createdAt: new Date(),
        };

        // Override ID with UUID if result.id is not suitable or just rely on result.id if unique?
        // ImageKit IDs are unique.
        // Schema defines `id`.
        // Let's use result.id (ImageKit File ID) as our ID for simplicity, assuming 1:1.
        // Or generate UUID.
        // I prefer UUID.
        const dbId = uuidv4();
        const dbRecord = { ...newSig, id: dbId };

        await db.insert(signatures).values(dbRecord);

        // Return generic structure matching frontend expectations
        // Frontend expects Signature interface
        const responseSig: Signature = {
            id: dbId,
            name: dbRecord.name,
            filename: dbRecord.filename,
            filepath: dbRecord.fileUrl,
            createdAt: dbRecord.createdAt,
            fileId: dbRecord.fileId || undefined
        };

        res.json({ success: true, data: responseSig });
    } catch (error) {
        console.error('Upload signature error:', error);
        res.status(500).json({ success: false, error: 'Failed to upload signature' });
    }
});

// Delete signature
router.delete('/signatures/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const id = req.params.id;

        // Find signature
        const existing = await db.select().from(signatures).where(
            sql`${signatures.id} = ${id} AND ${signatures.userId} = ${userId}`
        );

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Signature not found' });
        }

        // Delete from storage (ImageKit)
        // We need filename or fileId.
        // storage.deleteFile takes 'filename' (which effectively is name or path).
        // Let's use filename stored in DB.
        const success = await storage.deleteFile('signatures', existing[0].filename);

        if (success) {
            // Delete from DB
            await db.delete(signatures).where(eq(signatures.id, id));
            res.json({ success: true, message: 'Signature deleted' });
        } else {
            // If storage delete fails, should we keep DB?
            // Or force delete?
            // "Signature not found" in storage?
            // Let's delete from DB anyway to clean up.
            await db.delete(signatures).where(eq(signatures.id, id));
            res.json({ success: true, message: 'Signature deleted (cleaned up)' });
        }
    } catch (error) {
        console.error('Delete signature error:', error);
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
        const isThumbnail = req.query.thumbnail === 'true';

        // Validate type
        if (!['templates', 'generated', 'signatures', 'bulk-zips'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid file type' });
        }

        let url = storage.getPublicUrl(type as StorageType, filename);

        // If it's a thumbnail request, append ImageKit's thumbnail suffix
        if (isThumbnail) {
            url = `${url}/ik-thumbnail.jpg`;
        }

        res.redirect(url);
    } catch (error) {
        res.status(404).json({ success: false, error: 'File not found' });
    }
});

export default router;
