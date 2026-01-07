
import { Router } from 'express';
import multer from 'multer';
import { db } from '../lib/db.js';
import { userAssets } from '../db/schema.js';
import { storage } from '../services/storage.service.js';
import { uploadConfig } from '../middleware/upload.js';
import { eq, desc, and } from 'drizzle-orm';
// import { nanoid } from 'nanoid'; // Removed

const router = Router();
const upload = multer(uploadConfig);

// Upload Asset
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Upload to ImageKit
        const result = await storage.saveFile(req.file, 'assets');

        // Save to DB
        const assetId = crypto.randomUUID();
        const asset = {
            id: assetId,
            userId,
            filename: result.name, // ImageKit might rename, use returned name
            fileUrl: result.url,
            fileId: result.id,
            width: 0, // TODO: Get dimensions if possible, ImageKit response might have it
            height: 0,
            createdAt: new Date(),
        };

        await db.insert(userAssets).values(asset);

        res.status(201).json({ success: true, data: asset });
    } catch (error: any) {
        console.error('Upload asset error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to upload asset' });
    }
});

// List Assets
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const assets = await db.query.userAssets.findMany({
            where: eq(userAssets.userId, userId),
            orderBy: [desc(userAssets.createdAt)],
        });

        res.json({ success: true, data: assets });
    } catch (error) {
        console.error('List assets error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch assets' });
    }
});

// Delete Asset
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const asset = await db.query.userAssets.findFirst({
            where: and(eq(userAssets.id, req.params.id), eq(userAssets.userId, userId))
        });

        if (!asset) {
            return res.status(404).json({ success: false, error: 'Asset not found' });
        }

        // Delete from ImageKit (if fileId exists)
        // If fileId is missing (legacy?), we might rely on filename, but storage.deleteFile uses filename usually? 
        // Let's check storage service deleteFile impl. It uses listFiles with name query then delete.
        // So passing filename is correct for our current impl.
        await storage.deleteFile('assets', asset.filename);

        // Delete from DB
        await db.delete(userAssets).where(eq(userAssets.id, req.params.id));

        res.json({ success: true, message: 'Asset deleted' });
    } catch (error) {
        console.error('Delete asset error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete asset' });
    }
});

export default router;
