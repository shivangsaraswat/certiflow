/**
 * Settings Routes
 * Global SMTP configuration management at account level
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db.js';
import { globalSmtpConfig, groups } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from '../services/encryption.service.js';
import nodemailer from 'nodemailer';

const router = Router();

// =============================================================================
// Global SMTP Configuration CRUD
// =============================================================================

/**
 * GET /api/settings/smtp - List user's global SMTP configurations
 */
router.get('/smtp', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const configs = await db
            .select({
                id: globalSmtpConfig.id,
                name: globalSmtpConfig.name,
                smtpHost: globalSmtpConfig.smtpHost,
                smtpPort: globalSmtpConfig.smtpPort,
                smtpEmail: globalSmtpConfig.smtpEmail,
                encryptionType: globalSmtpConfig.encryptionType,
                senderName: globalSmtpConfig.senderName,
                replyTo: globalSmtpConfig.replyTo,
                isDefault: globalSmtpConfig.isDefault,
                createdAt: globalSmtpConfig.createdAt,
                updatedAt: globalSmtpConfig.updatedAt,
            })
            .from(globalSmtpConfig)
            .where(eq(globalSmtpConfig.userId, userId));

        res.json({ success: true, data: configs });
    } catch (error) {
        console.error('Error fetching global SMTP configs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch SMTP configurations' });
    }
});

/**
 * GET /api/settings/smtp/:id - Get a specific global SMTP config with decrypted password
 */
router.get('/smtp/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const configs = await db
            .select()
            .from(globalSmtpConfig)
            .where(and(eq(globalSmtpConfig.id, id), eq(globalSmtpConfig.userId, userId)));

        if (!configs[0]) {
            return res.status(404).json({ success: false, error: 'SMTP configuration not found' });
        }

        const config = configs[0];
        res.json({
            success: true,
            data: {
                ...config,
                smtpPassword: decrypt(config.smtpPassword),
            },
        });
    } catch (error) {
        console.error('Error fetching global SMTP config:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch SMTP configuration' });
    }
});

/**
 * POST /api/settings/smtp - Create new global SMTP configuration
 */
router.post('/smtp', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { name, smtpHost, smtpPort, smtpEmail, smtpPassword, encryptionType, senderName, replyTo, isDefault } = req.body;

        if (!name || !smtpHost || !smtpPort || !smtpEmail || !smtpPassword) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const id = uuidv4();
        const encryptedPassword = encrypt(smtpPassword);

        // If this is set as default, unset other defaults for this user
        if (isDefault) {
            await db
                .update(globalSmtpConfig)
                .set({ isDefault: false })
                .where(eq(globalSmtpConfig.userId, userId));
        }

        await db.insert(globalSmtpConfig).values({
            id,
            userId,
            name,
            smtpHost,
            smtpPort: parseInt(smtpPort),
            smtpEmail,
            smtpPassword: encryptedPassword,
            encryptionType: encryptionType || 'TLS',
            senderName: senderName || null,
            replyTo: replyTo || null,
            isDefault: isDefault || false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({
            success: true,
            data: { id, name, message: 'SMTP configuration created successfully' },
        });
    } catch (error) {
        console.error('Error creating global SMTP config:', error);
        res.status(500).json({ success: false, error: 'Failed to create SMTP configuration' });
    }
});

/**
 * PUT /api/settings/smtp/:id - Update existing global SMTP configuration
 */
router.put('/smtp/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { name, smtpHost, smtpPort, smtpEmail, smtpPassword, encryptionType, senderName, replyTo, isDefault } = req.body;

        // Verify ownership
        const existing = await db
            .select()
            .from(globalSmtpConfig)
            .where(and(eq(globalSmtpConfig.id, id), eq(globalSmtpConfig.userId, userId)));

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'SMTP configuration not found' });
        }

        // Prepare update data
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (name) updateData.name = name;
        if (smtpHost) updateData.smtpHost = smtpHost;
        if (smtpPort) updateData.smtpPort = parseInt(smtpPort);
        if (smtpEmail) updateData.smtpEmail = smtpEmail;
        if (smtpPassword) updateData.smtpPassword = encrypt(smtpPassword);
        if (encryptionType) updateData.encryptionType = encryptionType;
        if (senderName !== undefined) updateData.senderName = senderName || null;
        if (replyTo !== undefined) updateData.replyTo = replyTo || null;

        // Handle default flag
        if (isDefault !== undefined) {
            if (isDefault) {
                // Unset other defaults
                await db
                    .update(globalSmtpConfig)
                    .set({ isDefault: false })
                    .where(eq(globalSmtpConfig.userId, userId));
            }
            updateData.isDefault = isDefault;
        }

        await db
            .update(globalSmtpConfig)
            .set(updateData)
            .where(eq(globalSmtpConfig.id, id));

        res.json({ success: true, data: { id, updated: true } });
    } catch (error) {
        console.error('Error updating global SMTP config:', error);
        res.status(500).json({ success: false, error: 'Failed to update SMTP configuration' });
    }
});

/**
 * DELETE /api/settings/smtp/:id - Delete global SMTP configuration
 */
router.delete('/smtp/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify ownership
        const existing = await db
            .select()
            .from(globalSmtpConfig)
            .where(and(eq(globalSmtpConfig.id, id), eq(globalSmtpConfig.userId, userId)));

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'SMTP configuration not found' });
        }

        // Clear references in groups before deleting
        await db
            .update(groups)
            .set({ globalSmtpConfigId: null })
            .where(eq(groups.globalSmtpConfigId, id));

        await db.delete(globalSmtpConfig).where(eq(globalSmtpConfig.id, id));

        res.json({ success: true, data: { deleted: true } });
    } catch (error) {
        console.error('Error deleting global SMTP config:', error);
        res.status(500).json({ success: false, error: 'Failed to delete SMTP configuration' });
    }
});

/**
 * POST /api/settings/smtp/:id/test - Test SMTP connection
 */
router.post('/smtp/:id/test', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Get config
        const configs = await db
            .select()
            .from(globalSmtpConfig)
            .where(and(eq(globalSmtpConfig.id, id), eq(globalSmtpConfig.userId, userId)));

        if (!configs[0]) {
            return res.status(404).json({ success: false, error: 'SMTP configuration not found' });
        }

        const config = configs[0];
        const decryptedPassword = decrypt(config.smtpPassword);

        const transportConfig: any = {
            host: config.smtpHost,
            port: config.smtpPort,
            auth: {
                user: config.smtpEmail,
                pass: decryptedPassword,
            },
        };

        if (config.encryptionType === 'SSL') {
            transportConfig.secure = true;
        } else if (config.encryptionType === 'TLS') {
            transportConfig.secure = false;
            transportConfig.requireTLS = true;
        } else {
            transportConfig.secure = false;
        }

        const transporter = nodemailer.createTransport(transportConfig);
        await transporter.verify();

        res.json({ success: true, message: 'SMTP connection successful' });
    } catch (error: any) {
        console.error('SMTP test failed:', error);
        res.status(400).json({ success: false, error: error.message || 'SMTP connection failed' });
    }
});

/**
 * POST /api/settings/smtp/test - Test SMTP connection with provided credentials (before saving)
 */
router.post('/smtp/test', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { smtpHost, smtpPort, smtpEmail, smtpPassword, encryptionType } = req.body;

        if (!smtpHost || !smtpPort || !smtpEmail || !smtpPassword) {
            return res.status(400).json({ success: false, error: 'Missing required SMTP fields' });
        }

        const transportConfig: any = {
            host: smtpHost,
            port: parseInt(smtpPort),
            auth: {
                user: smtpEmail,
                pass: smtpPassword,
            },
        };

        if (encryptionType === 'SSL') {
            transportConfig.secure = true;
        } else if (encryptionType === 'TLS') {
            transportConfig.secure = false;
            transportConfig.requireTLS = true;
        } else {
            transportConfig.secure = false;
        }

        const transporter = nodemailer.createTransport(transportConfig);
        await transporter.verify();

        res.json({ success: true, message: 'SMTP connection successful' });
    } catch (error: any) {
        console.error('SMTP test failed:', error);
        res.status(400).json({ success: false, error: error.message || 'SMTP connection failed' });
    }
});

export default router;
