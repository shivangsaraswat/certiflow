/**
 * Groups API Routes
 * CRUD operations for certificate groups
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db.js';
import { groups, certificates, templates, bulkJobs, spreadsheets } from '../db/schema.js';
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
                const template = await db
                    .select({
                        id: templates.id,
                        name: templates.name,
                        code: templates.code,
                    })
                    .from(templates)
                    .where(eq(templates.id, group.templateId));

                const certCount = await db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(certificates)
                    .where(eq(certificates.groupId, group.id));

                return {
                    ...group,
                    template: template[0] || null,
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
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { name, description, templateId, sheetId } = req.body;

        if (!name || !templateId) {
            return res.status(400).json({
                success: false,
                error: 'Name and templateId are required',
            });
        }

        // Verify template exists
        const template = await db
            .select()
            .from(templates)
            .where(eq(templates.id, templateId));

        if (!template[0]) {
            return res.status(400).json({
                success: false,
                error: 'Template not found',
            });
        }

        const id = uuidv4();
        const now = new Date();

        await db.insert(groups).values({
            id,
            name,
            description: description || null,
            templateId,
            sheetId: sheetId || null,
            userId: userId,
            createdAt: now,
            updatedAt: now,
        });

        res.status(201).json({
            success: true,
            data: {
                id,
                name,
                description,
                templateId,
                sheetId: sheetId || null,
                template: {
                    id: template[0].id,
                    name: template[0].name,
                    code: template[0].code,
                },
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

        const template = await db
            .select()
            .from(templates)
            .where(eq(templates.id, group[0].templateId));

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

        res.json({
            success: true,
            data: {
                ...group[0],
                template: template[0] || null,
                sheet: sheet[0] || null,
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
