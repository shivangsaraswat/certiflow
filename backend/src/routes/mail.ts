/**
 * Mail API Routes
 * Email sending and tracking for certificate groups
 */

import { Router } from 'express';
import { db } from '../lib/db.js';
import { groups, mailJobs, mailLogs, spreadsheets, spreadsheetData, certificates } from '../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';
import { mailService } from '../services/mail.service.js';

const router = Router();

/**
 * POST /api/groups/:groupId/mail/send - Start a mail job
 */
router.post('/:groupId/mail/send', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { recipients } = req.body; // Array of { email, name, data }

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${groupId} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        const group = existing[0];

        // Validate group has required configuration
        if (!group.emailTemplateHtml || !group.emailSubject) {
            return res.status(400).json({ success: false, error: 'Email template not configured' });
        }

        // Check SMTP config
        const smtpConfig = await mailService.getGroupSmtpConfig(groupId);
        if (!smtpConfig) {
            return res.status(400).json({ success: false, error: 'SMTP not configured' });
        }

        // Validate recipients
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ success: false, error: 'No recipients provided' });
        }

        // Create mail job
        const result = await mailService.createMailJob(groupId, recipients);

        if (!result.success || !result.jobId) {
            return res.status(500).json({ success: false, error: result.error || 'Failed to create mail job' });
        }

        // Start processing in background (non-blocking)
        setImmediate(() => {
            mailService.processMailJob(result.jobId!);
        });

        res.json({
            success: true,
            data: {
                jobId: result.jobId,
                totalRecipients: recipients.length,
                status: 'processing'
            }
        });
    } catch (error: any) {
        console.error('Error starting mail job:', error);
        res.status(500).json({ success: false, error: 'Failed to start mail job' });
    }
});

/**
 * GET /api/groups/:groupId/mail/jobs/:jobId - Get mail job status
 */
router.get('/:groupId/mail/jobs/:jobId', async (req, res) => {
    try {
        const { groupId, jobId } = req.params;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${groupId} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        const job = await mailService.getMailJobStatus(jobId);

        if (!job || job.groupId !== groupId) {
            return res.status(404).json({ success: false, error: 'Mail job not found' });
        }

        res.json({
            success: true,
            data: {
                id: job.id,
                status: job.status,
                totalRecipients: job.totalRecipients,
                sentCount: job.sentCount,
                failedCount: job.failedCount,
                progress: job.totalRecipients > 0 ? Math.round((job.sentCount + job.failedCount) / job.totalRecipients * 100) : 0,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
            }
        });
    } catch (error: any) {
        console.error('Error getting mail job status:', error);
        res.status(500).json({ success: false, error: 'Failed to get job status' });
    }
});

/**
 * GET /api/groups/:groupId/mail/history - Get mail history
 */
router.get('/:groupId/mail/history', async (req, res) => {
    try {
        const { groupId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${groupId} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        const history = await mailService.getMailHistory(groupId, limit, offset);

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(mailLogs)
            .where(eq(mailLogs.groupId, groupId));

        res.json({
            success: true,
            data: history,
            pagination: {
                total: countResult[0]?.count || 0,
                limit,
                offset,
            }
        });
    } catch (error: any) {
        console.error('Error getting mail history:', error);
        res.status(500).json({ success: false, error: 'Failed to get mail history' });
    }
});

/**
 * GET /api/groups/:groupId/mail/participants - Get participants from connected spreadsheet
 */
router.get('/:groupId/mail/participants', async (req, res) => {
    try {
        const { groupId } = req.params;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Get group with column mapping
        const groupData = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${groupId} AND ${groups.userId} = ${userId}`);

        if (!groupData[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        const group = groupData[0];

        // Fetch participants from generated certificates instead of spreadsheet
        const certs = await db
            .select({
                id: certificates.id,
                name: certificates.recipientName,
                email: certificates.recipientEmail,
                data: certificates.data
            })
            .from(certificates)
            .where(eq(certificates.groupId, groupId))
            .orderBy(desc(certificates.createdAt));

        const participants = certs
            .filter(c => c.email && c.email.trim() !== '')
            .map((c, index) => ({
                id: index + 1, // Frontend expects number ID for selection
                email: c.email!,
                name: c.name,
                data: (c.data as Record<string, string>) || {},
                certificateId: c.id // Keep track of the certificate ID
            }));

        res.json({
            success: true,
            data: participants,
            headers: ['Name', 'Email'], // Simplified headers
            columnMapping: { email: 'Email', name: 'Name' }, // Mock mapping
        });

    } catch (error: any) {
        console.error('Error getting participants from certificates:', error);
        res.status(500).json({ success: false, error: 'Failed to get participants' });
    }
});

/**
 * DELETE /api/groups/:groupId/mail/history/:logId - Delete a mail log entry
 */
router.delete('/:groupId/mail/history/:logId', async (req, res) => {
    try {
        const { groupId, logId } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${groupId} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Delete the log entry
        await db
            .delete(mailLogs)
            .where(sql`${mailLogs.id} = ${logId} AND ${mailLogs.groupId} = ${groupId}`);

        res.json({ success: true, message: 'Log entry deleted' });
    } catch (error: any) {
        console.error('Error deleting mail log:', error);
        res.status(500).json({ success: false, error: 'Failed to delete log entry' });
    }
});

export default router;
