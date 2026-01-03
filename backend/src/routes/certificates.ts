
import { Router } from 'express';
import { db } from '../lib/db.js';
import { certificates } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { storage } from '../services/storage.service.js';

const router = Router();

// Delete certificate
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get certificate details to find fileId
        const certRecord = await db.select().from(certificates).where(eq(certificates.id, id));

        if (!certRecord[0]) {
            return res.status(404).json({ success: false, error: 'Certificate not found' });
        }

        const cert = certRecord[0];

        // 2. Delete file from storage (ImageKit)
        if (cert.fileId) {
            try {
                await storage.deleteFile(cert.fileId);
            } catch (err) {
                console.error(`[Delete] Failed to delete file ${cert.fileId} from storage:`, err);
                // Continue with DB deletion even if storage fails
            }
        }

        // 3. Delete record from database
        await db.delete(certificates).where(eq(certificates.id, id));

        res.json({
            success: true,
            data: { message: 'Certificate deleted successfully' }
        });
    } catch (error) {
        console.error('Delete Certificate Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete certificate' });
    }
});

export default router;
