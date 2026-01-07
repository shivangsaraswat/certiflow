
import { db } from '../lib/db.js';
import { templates } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import path from 'path';
import fs from 'fs';
import type { Template, DynamicAttribute } from '../types/index.js';
import { getPDFMetadata } from '../engine/renderer.js';
import { storage } from './storage.service.js';

/**
 * Get all templates
 */
export interface TemplateFilters {
    category?: string;
    style?: string;
    color?: string;
    search?: string;
    publicOnly?: boolean;
}

/**
 * Get all templates
 * Returns templates owned by userId OR public templates
 * Applies optional filters
 */
export async function getAllTemplates(userId: string, filters: TemplateFilters = {}): Promise<Template[]> {
    const conditions = [];

    // Base access control: My templates OR Public templates
    // If publicOnly is strictly true, we only show public
    if (filters.publicOnly) {
        conditions.push(eq(templates.isPublic, true));
    } else {
        // Default: Mine OR Public
        conditions.push(sql`(${templates.userId} = ${userId} OR ${templates.isPublic} = true)`);
    }

    // Apply filters
    if (filters.category) {
        conditions.push(eq(templates.category, filters.category));
    }
    if (filters.style) {
        conditions.push(eq(templates.style, filters.style));
    }
    if (filters.color) {
        conditions.push(eq(templates.color, filters.color));
    }
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        conditions.push(sql`(lower(${templates.name}) LIKE ${`%${searchLower}%`} OR lower(${templates.description}) LIKE ${`%${searchLower}%`})`);
    }

    const allTemplates = await db.select().from(templates)
        .where(
            conditions.length > 1
                ? sql.join(conditions, sql` AND `)
                : conditions[0]
        );

    return allTemplates.map(toTemplate);
}

/**
 * Get template by ID
 */
/**
 * Get template by ID
 * Note: Caller should verify access if needed, but simple reading is OK for public.
 * Actually, we should check access here too if we want strict privacy.
 * But let's check access in the usage or here.
 * For now, return IF owned or public.
 */
export async function getTemplateById(id: string, userId?: string): Promise<Template | null> {
    const query = db.select().from(templates).where(eq(templates.id, id));
    const result = await query;
    if (!result[0]) return null;

    const t = result[0];
    if (t.isPublic) return toTemplate(t);
    // If no userId provided, restricted
    if (!userId) return null;

    // Check ownership
    if (t.userId === userId) return toTemplate(t);

    return null; // Exists but private
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string, userId: string): Promise<boolean> {
    // Only delete if owned by user
    const result = await db.delete(templates)
        .where(
            sql`${templates.id} = ${id} AND ${templates.userId} = ${userId}`
        )
        .returning();
    return result.length > 0;
}

/**
 * Create template from file
 */
// Create template from file
export const createTemplate = async (
    file: Express.Multer.File,
    userId: string,
    data?: {
        name?: string,
        description?: string,
        code?: string,
        category?: string,
        style?: string,
        color?: string,
        isPublic?: boolean
    }
): Promise<Template> => {
    // Validate code
    if (!data?.code) {
        throw new Error('Template code is required');
    }

    const code = data.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 1 || code.length > 5) {
        throw new Error('Template code must be 1-5 alphanumeric characters');
    }

    // Check if code is unique
    const existingCode = await db.select().from(templates).where(eq(templates.code, code));
    if (existingCode.length > 0) {
        throw new Error('Template code already exists');
    }

    // 1. Read file buffer immediately to avoid re-fetching or file deletion issues
    let fileBuffer: Buffer;
    if (file.buffer) {
        fileBuffer = file.buffer;
    } else if (file.path) {
        fileBuffer = fs.readFileSync(file.path);
    } else {
        throw new Error('File content missing');
    }

    // 2. Upload to Storage (ImageKit)
    // We use the 'templates' type. 
    // storage.saveFile will handle the upload and cleanup of the temp file.
    const uploadResult = await storage.saveFile(file, 'templates');

    // 3. Extract metadata using the local buffer
    // This avoids calling storage.getFile which can fail due to eventual consistency
    const id = uuidv4();
    const metadata = await getPDFMetadata(fileBuffer);

    const newTemplate = {
        id,
        code,
        name: data?.name || file.originalname.replace(/\.pdf$/i, ''),
        description: data?.description || '',
        filename: uploadResult.name, // Use the name stored in ImageKit
        filepath: uploadResult.name, // Legacy field, keeping consistent with filename for now
        fileUrl: uploadResult.url,
        fileId: uploadResult.id,
        pageCount: metadata.pageCount,
        width: metadata.width,
        height: metadata.height,
        attributes: [] as DynamicAttribute[],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId, // Set owner
        isPublic: data?.isPublic ?? false,
        category: data?.category || null,
        style: data?.style || null,
        color: data?.color || null,
    };

    await db.insert(templates).values(newTemplate);

    return toTemplate(newTemplate);
};

export const updateTemplate = async (id: string, userId: string, updates: Partial<Template>, sourceTemplateId?: string): Promise<Template | null> => {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.style !== undefined) updateData.style = updates.style;
    if (updates.color !== undefined) updateData.color = updates.color;

    // If sourceTemplateId is provided, copy file metadata from that template
    if (sourceTemplateId) {
        const sourceTemplate = await getTemplateById(sourceTemplateId);
        // Ensure source exists and is accessible (Public or Owned by user)
        if (sourceTemplate && (sourceTemplate.isPublic || sourceTemplate.userId === userId)) {
            updateData.filename = sourceTemplate.filename;
            updateData.filepath = sourceTemplate.filepath;
            updateData.fileUrl = sourceTemplate.fileUrl;
            updateData.fileId = sourceTemplate.fileId;
            updateData.pageCount = sourceTemplate.pageCount;
            updateData.width = sourceTemplate.width;
            updateData.height = sourceTemplate.height;
            // Also copy attributes logic? Usually yes, if we swap background we often want the layout too.
            // But we should probably allow 'updates.attributes' to override if passed, or just copy source.
            // Let's copy source attributes unless explicitly provided in 'updates'
            // However, typical flow is: Select Template -> Frontend gets attributes -> Frontend calls save with attributes.
            // But if we want to save the "Background Swap", we need this.
            // Let's assume frontend passes attributes if it wants to customization, but if not, we take source.
            if (!updates.attributes) {
                updateData.attributes = sourceTemplate.attributes;
            }
        }
    }

    updateData.updatedAt = new Date();

    const result = await db.update(templates)
        .set(updateData)
        .where(
            sql`${templates.id} = ${id} AND ${templates.userId} = ${userId}`
        )
        .returning();

    return result[0] ? toTemplate(result[0]) : null;
};

// Attribute handling helper
export const addAttribute = async (templateId: string, userId: string, attribute: Omit<DynamicAttribute, 'id'>): Promise<Template | null> => {
    const existing = await getTemplateById(templateId, userId);
    // getTemplateById already checks ownership/public. 
    // BUT for mutation (addAttribute), we must stricter: MUST BE OWNER.
    // getTemplateById returns public temps too. We can't edit public temp if we don't own it.
    // So we need explicit check.
    if (!existing) return null;
    if (existing.userId !== userId) return null; // Unauthorized to edit

    const currentAttributes = existing.attributes;
    const newAttribute: DynamicAttribute = {
        ...attribute,
        id: `attr_${uuidv4().substring(0, 8)}`,
    };

    const updatedAttributes = [...currentAttributes, newAttribute];

    await db.update(templates)
        .set({ attributes: updatedAttributes, updatedAt: new Date() })
        .where(eq(templates.id, templateId));

    return getTemplateById(templateId, userId);
};

export const updateAttribute = async (templateId: string, userId: string, attributeId: string, updates: Partial<DynamicAttribute>): Promise<Template | null> => {
    const existing = await getTemplateById(templateId, userId);
    if (!existing || existing.userId !== userId) return null;

    const currentAttributes = existing.attributes;
    const attrIndex = currentAttributes.findIndex(a => a.id === attributeId);
    if (attrIndex === -1) return null;

    const updatedAttributes = [...currentAttributes];
    updatedAttributes[attrIndex] = { ...updatedAttributes[attrIndex], ...updates };

    await db.update(templates)
        .set({ attributes: updatedAttributes, updatedAt: new Date() })
        .where(eq(templates.id, templateId));

    return getTemplateById(templateId, userId);
};

export const deleteAttribute = async (templateId: string, userId: string, attributeId: string): Promise<Template | null> => {
    const existing = await getTemplateById(templateId, userId);
    if (!existing || existing.userId !== userId) return null;

    const updatedAttributes = existing.attributes.filter(a => a.id !== attributeId);

    await db.update(templates)
        .set({ attributes: updatedAttributes, updatedAt: new Date() })
        .where(eq(templates.id, templateId));

    return getTemplateById(templateId, userId);
};

export const updateAllAttributes = async (templateId: string, userId: string, attributes: DynamicAttribute[]): Promise<Template | null> => {
    const existing = await getTemplateById(templateId, userId);
    if (!existing || existing.userId !== userId) return null;

    await db.update(templates)
        .set({ attributes: attributes, updatedAt: new Date() })
        .where(eq(templates.id, templateId));

    return getTemplateById(templateId, userId);
};


// Helper to cast DB result to correct types
function toTemplate(dbRecord: any): Template {
    return {
        ...dbRecord,
        attributes: (dbRecord.attributes as DynamicAttribute[]) ?? [],
        format: 'pdf', // Hardcoded as we only support PDF
    };
}
