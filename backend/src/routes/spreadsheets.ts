
import { Router } from 'express';
import { db } from '../lib/db.js';
import { spreadsheets, spreadsheetData } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/spreadsheets - List all spreadsheets
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const result = await db
            .select()
            .from(spreadsheets)
            .where(eq(spreadsheets.userId, userId))
            .orderBy(desc(spreadsheets.updatedAt));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Failed to list spreadsheets:', error);
        res.status(500).json({ success: false, error: 'Failed to list spreadsheets' });
    }
});

// GET /api/spreadsheets/:id - Get spreadsheet with data
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const sheet = await db.select().from(spreadsheets)
            .where(sql`${spreadsheets.id} = ${id} AND ${spreadsheets.userId} = ${userId}`);

        if (sheet.length === 0) {
            return res.status(404).json({ success: false, error: 'Spreadsheet not found' });
        }

        const data = await db.select().from(spreadsheetData).where(eq(spreadsheetData.spreadsheetId, id));

        res.json({
            success: true,
            data: {
                ...sheet[0],
                content: data[0]?.content || [] // Return empty array if no content
            }
        });
    } catch (error) {
        console.error('Failed to get spreadsheet:', error);
        res.status(500).json({ success: false, error: 'Failed to get spreadsheet' });
    }
});

// POST /api/spreadsheets - Create new spreadsheet
router.post('/', async (req, res) => {
    try {
        const { name, content } = req.body;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const id = uuidv4();

        // Transaction to create sheet and initial data
        await db.transaction(async (tx) => {
            await tx.insert(spreadsheets).values({
                id,
                name: name || 'Untitled Spreadsheet',
                userId: userId,
            });

            if (content) {
                await tx.insert(spreadsheetData).values({
                    id: uuidv4(),
                    spreadsheetId: id,
                    content: content,
                });
            } else {
                // Initialize with empty default FortuneSheet data structure if needed
                // For now, we can just leave it empty or insert standard blank sheet
                await tx.insert(spreadsheetData).values({
                    id: uuidv4(),
                    spreadsheetId: id,
                    content: [{ name: 'Sheet1', celldata: [] }],
                });
            }
        });

        const newSheet = await db.select().from(spreadsheets).where(eq(spreadsheets.id, id));
        res.json({ success: true, data: newSheet[0] });
    } catch (error) {
        console.error('Failed to create spreadsheet:', error);
        res.status(500).json({ success: false, error: 'Failed to create spreadsheet' });
    }
});

// PUT /api/spreadsheets/:id - Update spreadsheet data
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, content } = req.body;

        console.log(`[Spreadsheet PUT] Updating ${id}. Name: ${name ? 'YES' : 'NO'}, Content size: ${content ? JSON.stringify(content).length : '0'}`);

        // Verify exists and ownership
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const sheet = await db.select().from(spreadsheets)
            .where(sql`${spreadsheets.id} = ${id} AND ${spreadsheets.userId} = ${userId}`);
        if (sheet.length === 0) {
            return res.status(404).json({ success: false, error: 'Spreadsheet not found' });
        }

        // Update name if provided
        if (name) {
            await db.update(spreadsheets)
                .set({ name, updatedAt: new Date() })
                .where(eq(spreadsheets.id, id));
        }

        // Update content if provided
        if (content) {
            // Check if data row exists
            const existingData = await db.select().from(spreadsheetData).where(eq(spreadsheetData.spreadsheetId, id));

            if (existingData.length > 0) {
                await db.update(spreadsheetData)
                    .set({ content })
                    .where(eq(spreadsheetData.spreadsheetId, id));
            } else {
                await db.insert(spreadsheetData).values({
                    id: uuidv4(),
                    spreadsheetId: id,
                    content,
                });
            }

            // Touch updatedAt on parent
            await db.update(spreadsheets)
                .set({ updatedAt: new Date() })
                .where(eq(spreadsheets.id, id));
        }

        res.json({ success: true, message: 'Updated successfully' });
    } catch (error) {
        console.error('Failed to update spreadsheet:', error);
        res.status(500).json({ success: false, error: 'Failed to update spreadsheet' });
    }
});

// DELETE /api/spreadsheets/:id - Delete spreadsheet
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const result = await db.delete(spreadsheets)
            .where(sql`${spreadsheets.id} = ${id} AND ${spreadsheets.userId} = ${userId}`)
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ success: false, error: 'Spreadsheet not found' });
        }

        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Failed to delete spreadsheet:', error);
        res.status(500).json({ success: false, error: 'Failed to delete spreadsheet' });
    }
});

export default router;
