
import { Router } from 'express';
import { db } from '../lib/db.js';
import { certificates, bulkJobs } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getTemplateById } from '../services/template.service.js';
import { getBulkJobById } from '../services/bulk.service.js';
import type { Certificate } from '../types/index.js';

const router = Router();

// List generated certificates
router.get('/certificates', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const results = await db.select().from(certificates)
            .orderBy(desc(certificates.createdAt))
            .limit(limit)
            .offset(offset);

        // Include template Name?
        // We can join, but for simplicity let's stick to base record for list
        // Or do a manual fetch if needed.
        // Actually Drizzle query builder (Relational) makes this easy.
        // But we initialized regular client. Relational queries available via db.query.certificates.findMany()
        // Let's assume schema has relations defined, so we can use query API?
        // My `db.ts` uses `drizzle(pool, { schema })`. Yes.

        // Let's try relational API for better data:
        // const results = await db.query.certificates.findMany({
        //     with: { template: true },
        //     limit,
        //     offset,
        //     orderBy: desc(certificates.createdAt)
        // });

        // Use simpler select for now to minimize Type errors during migration
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
});

// Get single certificate details
router.get('/certificates/:id', async (req, res) => {
    try {
        const cert = await db.query.certificates.findFirst({
            where: eq(certificates.id, req.params.id),
            with: { template: true }
        });

        if (!cert) {
            return res.status(404).json({ success: false, error: 'Certificate not found' });
        }
        res.json({ success: true, data: cert });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch certificate' });
    }
});

// Verify certificate (Public)
router.get('/verify/:code', async (req, res) => {
    try {
        const cert = await db.query.certificates.findFirst({
            where: eq(certificates.certificateCode, req.params.code),
            with: { template: true }
        });

        if (!cert) {
            return res.status(404).json({ success: false, error: 'Certificate not found' });
        }

        // Return public verification data
        res.json({
            success: true,
            data: {
                valid: true,
                recipient: cert.recipientName,
                issueDate: cert.createdAt,
                templateName: cert.template.name,
                downloadUrl: `/api/files/download/generated/${cert.filename}`
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

// List bulk jobs
router.get('/bulk-jobs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = parseInt(req.query.offset as string) || 0;

        const jobs = await db.query.bulkJobs.findMany({
            orderBy: desc(bulkJobs.createdAt),
            limit,
            offset,
            with: { template: true }
        });

        res.json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
    }
});

// Get bulk job details
router.get('/bulk-jobs/:id', async (req, res) => {
    try {
        const job = await getBulkJobById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch job details' });
    }
});

export default router;
