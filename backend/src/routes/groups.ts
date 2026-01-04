/**
 * Groups API Routes
 * CRUD operations for certificate groups
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db.js';
import { groups, certificates, templates, bulkJobs, spreadsheets, groupSmtpConfig } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const router = Router();

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * GET /api/groups - List all groups with certificate counts
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const allGroups = await db
            .select({
                id: groups.id,
                name: groups.name,
                description: groups.description,
                templateId: groups.templateId,
                createdAt: groups.createdAt,
                updatedAt: groups.updatedAt,
            })
            .from(groups)
            .where(eq(groups.userId, userId))
            .orderBy(desc(groups.createdAt));

        // Get template info and certificate counts for each group
        const result = await Promise.all(
            allGroups.map(async (group) => {
                let template = null;
                if (group.templateId) {
                    const templateResult = await db
                        .select({
                            id: templates.id,
                            name: templates.name,
                            code: templates.code,
                        })
                        .from(templates)
                        .where(eq(templates.id, group.templateId));
                    template = templateResult[0] || null;
                }

                const certCount = await db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(certificates)
                    .where(eq(certificates.groupId, group.id));

                return {
                    ...group,
                    template,
                    certificateCount: certCount[0]?.count || 0,
                };
            })
        );

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch groups' });
    }
});

/**
 * POST /api/groups - Create a new group
 * Simplified: Only name and description required
 * Template and data vault are configured in settings after creation
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Name is required',
            });
        }

        const id = uuidv4();
        const now = new Date();

        await db.insert(groups).values({
            id,
            name,
            description: description || null,
            templateId: null, // Configured in settings
            sheetId: null,    // Configured in settings
            userId: userId,
            createdAt: now,
            updatedAt: now,
        });

        res.status(201).json({
            success: true,
            data: {
                id,
                name,
                description: description || null,
                templateId: null,
                sheetId: null,
                template: null,
                sheet: null,
                certificateCount: 0,
                createdAt: now,
                updatedAt: now,
            },
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ success: false, error: 'Failed to create group' });
    }
});

/**
 * GET /api/groups/:id - Get group details with template
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const group = await db
            .select()
            .from(groups)
            .where(
                sql`${groups.id} = ${id} AND ${groups.userId} = ${userId}`
            );

        if (!group[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        let template = null;
        if (group[0].templateId) {
            const templateResult = await db
                .select()
                .from(templates)
                .where(eq(templates.id, group[0].templateId));
            template = templateResult[0] || null;
        }

        const certCount = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(certificates)
            .where(eq(certificates.groupId, id));

        const sheet = group[0].sheetId ? await db
            .select({
                id: spreadsheets.id,
                name: spreadsheets.name,
            })
            .from(spreadsheets)
            .where(eq(spreadsheets.id, group[0].sheetId)) : [];

        const { decrypt } = await import('../services/encryption.service.js');

        const smtpConfig = await db
            .select()
            .from(groupSmtpConfig)
            .where(eq(groupSmtpConfig.groupId, id));

        let decryptedSmtpConfig = null;
        if (smtpConfig[0]) {
            decryptedSmtpConfig = { ...smtpConfig[0] };
            if (decryptedSmtpConfig.smtpPassword) {
                try {
                    decryptedSmtpConfig.smtpPassword = decrypt(decryptedSmtpConfig.smtpPassword);
                } catch (error) {
                    console.error('Failed to decrypt SMTP password for group response:', error);
                    decryptedSmtpConfig.smtpPassword = ''; // Clear if decryption fails
                }
            }
        }

        res.json({
            success: true,
            data: {
                ...group[0],
                template,
                sheet: sheet[0] || null,
                smtpConfig: decryptedSmtpConfig,
                certificateCount: certCount[0]?.count || 0,
            },
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch group' });
    }
});

/**
 * PUT /api/groups/:id - Update group
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const existing = await db
            .select()
            .from(groups)
            .where(
                sql`${groups.id} = ${id} AND ${groups.userId} = ${userId}`
            );

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        await db
            .update(groups)
            .set({
                name: name || existing[0].name,
                description: description !== undefined ? description : existing[0].description,
                updatedAt: new Date(),
            })
            .where(eq(groups.id, id));

        res.json({ success: true, data: { id, updated: true } });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ success: false, error: 'Failed to update group' });
    }
});

/**
 * DELETE /api/groups/:id - Delete group
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const existing = await db
            .select()
            .from(groups)
            .where(
                sql`${groups.id} = ${id} AND ${groups.userId} = ${userId}`
            );

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        await db.delete(groups).where(eq(groups.id, id));

        res.json({ success: true, data: { deleted: true } });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ success: false, error: 'Failed to delete group' });
    }
});

// =============================================================================
// Group Settings APIs
// =============================================================================

/**
 * PUT /api/groups/:id/settings/template - Update template selection
 */
router.put('/:id/settings/template', async (req, res) => {
    try {
        const { id } = req.params;
        const { templateId } = req.body;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${id} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Verify template exists if provided
        if (templateId) {
            const template = await db
                .select({ id: templates.id })
                .from(templates)
                .where(eq(templates.id, templateId));

            if (!template[0]) {
                return res.status(400).json({ success: false, error: 'Template not found' });
            }
        }

        await db
            .update(groups)
            .set({
                templateId: templateId || null,
                updatedAt: new Date(),
            })
            .where(eq(groups.id, id));

        res.json({ success: true, data: { id, templateId, updated: true } });
    } catch (error) {
        console.error('Error updating group template:', error);
        res.status(500).json({ success: false, error: 'Failed to update template' });
    }
});

/**
 * PUT /api/groups/:id/settings/data - Update data vault configuration
 */
router.put('/:id/settings/data', async (req, res) => {
    try {
        const { id } = req.params;
        const { sheetId, selectedSheetTab, columnMapping } = req.body;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${id} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Verify spreadsheet exists if provided
        if (sheetId) {
            const sheet = await db
                .select({ id: spreadsheets.id })
                .from(spreadsheets)
                .where(eq(spreadsheets.id, sheetId));

            if (!sheet[0]) {
                return res.status(400).json({ success: false, error: 'Spreadsheet not found' });
            }
        }

        await db
            .update(groups)
            .set({
                sheetId: sheetId || null,
                selectedSheetTab: selectedSheetTab || null,
                columnMapping: columnMapping || null,
                updatedAt: new Date(),
            })
            .where(eq(groups.id, id));

        res.json({ success: true, data: { id, sheetId, selectedSheetTab, columnMapping, updated: true } });
    } catch (error) {
        console.error('Error updating group data config:', error);
        res.status(500).json({ success: false, error: 'Failed to update data configuration' });
    }
});

/**
 * PUT /api/groups/:id/settings/email-template - Update email template
 */
router.put('/:id/settings/email-template', async (req, res) => {
    try {
        const { id } = req.params;
        const { emailSubject, emailTemplateHtml } = req.body;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${id} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        await db
            .update(groups)
            .set({
                emailSubject: emailSubject || null,
                emailTemplateHtml: emailTemplateHtml || null,
                updatedAt: new Date(),
            })
            .where(eq(groups.id, id));

        res.json({ success: true, data: { id, emailSubject, updated: true } });
    } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).json({ success: false, error: 'Failed to update email template' });
    }
});

/**
 * PUT /api/groups/:id/settings/smtp - Save SMTP configuration
 */
router.put('/:id/settings/smtp', async (req, res) => {
    try {
        const { id } = req.params;
        const { smtpHost, smtpPort, smtpEmail, smtpPassword, encryptionType, senderName, replyTo } = req.body;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${id} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Import encryption service
        const { encrypt } = await import('../services/encryption.service.js');

        // Check if SMTP config exists
        const existingConfig = await db
            .select()
            .from(groupSmtpConfig)
            .where(eq(groupSmtpConfig.groupId, id));

        const encryptedPassword = smtpPassword ? encrypt(smtpPassword) : existingConfig[0]?.smtpPassword;

        if (existingConfig[0]) {
            await db
                .update(groupSmtpConfig)
                .set({
                    smtpHost,
                    smtpPort: parseInt(smtpPort),
                    smtpEmail,
                    smtpPassword: encryptedPassword,
                    encryptionType: encryptionType || 'TLS',
                    senderName: senderName || null,
                    replyTo: replyTo || null,
                    isConfigured: true,
                    updatedAt: new Date(),
                })
                .where(eq(groupSmtpConfig.groupId, id));
        } else {
            await db
                .insert(groupSmtpConfig)
                .values({
                    id: crypto.randomUUID(),
                    groupId: id,
                    smtpHost,
                    smtpPort: parseInt(smtpPort),
                    smtpEmail,
                    smtpPassword: encryptedPassword,
                    encryptionType: encryptionType || 'TLS',
                    senderName: senderName || null,
                    replyTo: replyTo || null,
                    isConfigured: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
        }

        res.json({ success: true, data: { id, smtpEmail, updated: true } });
    } catch (error) {
        console.error('Error saving SMTP config:', error);
        res.status(500).json({ success: false, error: 'Failed to save SMTP configuration' });
    }
});

/**
 * POST /api/groups/:id/settings/smtp/test - Test SMTP connection
 */
router.post('/:id/settings/smtp/test', async (req, res) => {
    try {
        const { id } = req.params;
        const { smtpHost, smtpPort, smtpEmail, smtpPassword, encryptionType } = req.body;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Verify group ownership
        const existing = await db
            .select()
            .from(groups)
            .where(sql`${groups.id} = ${id} AND ${groups.userId} = ${userId}`);

        if (!existing[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Test SMTP connection using nodemailer
        const nodemailer = await import('nodemailer');
        const { decrypt } = await import('../services/encryption.service.js');

        let passwordToUse = smtpPassword;

        // If no password provided, try to fetch saved config
        if (!passwordToUse) {
            const savedConfig = await db
                .select()
                .from(groupSmtpConfig)
                .where(eq(groupSmtpConfig.groupId, id));

            if (savedConfig[0] && savedConfig[0].smtpPassword) {
                try {
                    passwordToUse = decrypt(savedConfig[0].smtpPassword);
                } catch (e) {
                    console.error('Failed to decrypt saved password for test:', e);
                }
            }
        }

        const transportConfig: any = {
            host: smtpHost,
            port: parseInt(smtpPort),
            auth: {
                user: smtpEmail,
                pass: passwordToUse,
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

// =============================================================================
// Certificates in Group
// =============================================================================

/**
 * GET /api/groups/:id/certificates - List certificates in a group
 */
router.get('/:id/certificates', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const certs = await db
            .select({
                id: certificates.id,
                certificateCode: certificates.certificateCode,
                recipientName: certificates.recipientName,
                recipientEmail: certificates.recipientEmail,
                filename: certificates.filename,
                fileUrl: certificates.fileUrl,
                generationMode: certificates.generationMode,
                createdAt: certificates.createdAt,
            })
            .from(certificates)
            .where(eq(certificates.groupId, id))
            .orderBy(desc(certificates.createdAt))
            .limit(Number(limit))
            .offset(Number(offset));

        const totalCount = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(certificates)
            .where(eq(certificates.groupId, id));

        res.json({
            success: true,
            data: {
                certificates: certs,
                total: totalCount[0]?.count || 0,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error) {
        console.error('Error fetching group certificates:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
    }
});

// =============================================================================
// Certificate Generation in Group
// =============================================================================

import multer from 'multer';
import { uploadConfig } from '../middleware/upload.js';
import { renderCertificate, generateCertificateCode } from '../engine/renderer.js';
import { storage } from '../services/storage.service.js';
import { getTemplateById } from '../services/template.service.js';
import { createCertificateRecord } from '../services/certificate.service.js';
import { processBulkGeneration } from '../services/bulk.service.js';

const upload = multer(uploadConfig);

/**
 * POST /api/groups/:id/generate/single - Generate single certificate in group
 */
router.post('/:id/generate/single', async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { data, recipientName, recipientEmail } = req.body;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Get group and template (verify ownership of group)
        const group = await db.select().from(groups)
            .where(sql`${groups.id} = ${groupId} AND ${groups.userId} = ${userId}`);
        if (!group[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Check if template is configured
        if (!group[0].templateId) {
            return res.status(400).json({ success: false, error: 'Template not configured. Please configure the group settings first.' });
        }

        const template = await getTemplateById(group[0].templateId, userId);
        if (!template) {
            return res.status(400).json({ success: false, error: 'Template not found' });
        }

        // Generate certificate code using template code and email
        const certificateCode = generateCertificateCode(template.code, recipientEmail);
        const filename = `${certificateCode}.pdf`;

        // Inject certificateId into data for rendering
        const renderData = { ...data, certificateId: certificateCode };

        // Render PDF
        const pdfBuffer = await renderCertificate(template, renderData, recipientEmail);

        // Upload to storage
        const uploadPath = `generated/${filename}`;
        const uploadResult = await storage.uploadBuffer(pdfBuffer, uploadPath);

        // Save record
        await createCertificateRecord({
            certificateCode,
            templateId: template.id,
            groupId,
            recipientName: recipientName || 'Unknown Recipient',
            recipientEmail: recipientEmail || null,
            data: renderData,
            filename,
            filepath: filename,
            fileUrl: uploadResult.url,
            fileId: uploadResult.id,
            generationMode: 'single',
            bulkJobId: null,
            userId: userId
        });

        res.json({
            success: true,
            data: {
                certificateId: certificateCode,
                filename,
                downloadUrl: `/api/files/download/generated/${filename}`,
                fileUrl: uploadResult.url
            }
        });
    } catch (error: any) {
        console.error('Single generation in group error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate certificate' });
    }
});

/**
 * POST /api/groups/:id/generate/bulk - Bulk generate certificates in group
 */
router.post('/:id/generate/bulk', upload.single('csv'), async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { columnMapping: mappingStr, sheetId } = req.body;

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Get group (verify ownership)
        const group = await db.select().from(groups)
            .where(sql`${groups.id} = ${groupId} AND ${groups.userId} = ${userId}`);
        if (!group[0]) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Check if template is configured
        if (!group[0].templateId) {
            return res.status(400).json({ success: false, error: 'Template not configured. Please configure the group settings first.' });
        }

        const templateId = group[0].templateId;

        let columnMapping: Record<string, string>;
        try {
            columnMapping = JSON.parse(mappingStr);
        } catch {
            return res.status(400).json({ success: false, error: 'Invalid column mapping' });
        }

        let source: any;
        if (sheetId) {
            source = { type: 'sheet', id: sheetId };
        } else if (req.file) {
            source = { type: 'csv', path: req.file.path };
        } else {
            return res.status(400).json({ success: false, error: 'Either CSV file or sheetId is required' });
        }

        // Start bulk generation with groupId
        const jobId = await processBulkGeneration(templateId, source, columnMapping, groupId);

        res.json({
            success: true,
            data: {
                jobId,
                message: 'Bulk generation started'
            }
        });
    } catch (error: any) {
        console.error('Bulk generation in group error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to start bulk generation' });
    }
});

export default router;
