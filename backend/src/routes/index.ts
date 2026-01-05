/**
 * Route Aggregator
 * Combines all API routes under a single router
 */

import { Router } from 'express';
import templateRoutes from './templates.js';
import generateRoutes from './generate.js';
import fileRoutes from './files.js';
import historyRoutes from './history.js';
import spreadsheetRoutes from './spreadsheets.js';
import groupRoutes from './groups.js';
import certificateRoutes from './certificates.js';
import mailRoutes from './mail.js';
import sharesRoutes from './shares.js';

const router = Router();

// Mount route modules
router.use('/templates', templateRoutes);
router.use('/generate', generateRoutes);
router.use('/files', fileRoutes);
router.use('/history', historyRoutes);
router.use('/spreadsheets', spreadsheetRoutes);
router.use('/groups', groupRoutes);
router.use('/certificates', certificateRoutes);
router.use('/groups', mailRoutes); // Mail routes are nested under groups
router.use('/groups/:groupId/shares', sharesRoutes); // Share management under groups
router.use('/shares', sharesRoutes); // Direct share routes (accept, pending)

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
        },
    });
});

export default router;
