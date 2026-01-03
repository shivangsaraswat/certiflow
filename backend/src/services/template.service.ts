
import { db } from '../lib/db.js';
import { templates } from '../db/schema.js';
import { eq } from 'drizzle-orm';
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
export async function getAllTemplates(): Promise<Template[]> {
    const allTemplates = await db.select().from(templates);
    return allTemplates.map(toTemplate);
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string): Promise<Template | null> {
    const result = await db.select().from(templates).where(eq(templates.id, id));
    return result[0] ? toTemplate(result[0]) : null;
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id)).returning();
    return result.length > 0;
}

/**
 * Create template from file
 */
// Create template from file
export const createTemplate = async (file: Express.Multer.File, data?: { name?: string, description?: string }): Promise<Template> => {
    // 1. Upload to Storage (ImageKit)
    // We use the 'templates' type
    const uploadResult = await storage.saveFile(file, 'templates');

    // 2. Fetch/Extract metadata
    // We need the file content to extract metadata (pdf-lib needs it).
    // storage.saveFile returns info, but we also need buffer. 
    // If we used diskStorage, we might have read it.
    // In ImageKit provider, we read buffer to upload.
    // We might need to fetch it back or optimized: read buffer first, then upload?
    // Let's fetch it back for consistency using getFile
    const fileBuffer = await storage.getFile('templates', uploadResult.name);

    const id = uuidv4();
    const metadata = await getPDFMetadata(fileBuffer);

    const newTemplate = {
        id,
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
    };

    await db.insert(templates).values(newTemplate);

    return toTemplate(newTemplate);
};

export const updateTemplate = async (id: string, updates: Partial<Template>): Promise<Template | null> => {
    // Only allow updating name, description
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;

    updateData.updatedAt = new Date();

    const result = await db.update(templates)
        .set(updateData)
        .where(eq(templates.id, id))
        .returning();

    return result[0] ? toTemplate(result[0]) : null;
};

// Attribute handling helper
export const addAttribute = async (templateId: string, attribute: Omit<DynamicAttribute, 'id'>): Promise<Template | null> => {
    const existing = await getTemplateById(templateId);
    if (!existing) return null;

    const currentAttributes = existing.attributes;
    const newAttribute: DynamicAttribute = {
        ...attribute,
        id: `attr_${uuidv4().substring(0, 8)}`,
    };

    const updatedAttributes = [...currentAttributes, newAttribute];

    await db.update(templates)
        .set({ attributes: updatedAttributes, updatedAt: new Date() })
        .where(eq(templates.id, templateId));

    return getTemplateById(templateId);
};

export const updateAttribute = async (templateId: string, attributeId: string, updates: Partial<DynamicAttribute>): Promise<Template | null> => {
    const existing = await getTemplateById(templateId);
    if (!existing) return null;

    const currentAttributes = existing.attributes;
    const attrIndex = currentAttributes.findIndex(a => a.id === attributeId);
    if (attrIndex === -1) return null;

    const updatedAttributes = [...currentAttributes];
    updatedAttributes[attrIndex] = { ...updatedAttributes[attrIndex], ...updates };

    await db.update(templates)
        .set({ attributes: updatedAttributes, updatedAt: new Date() })
        .where(eq(templates.id, templateId));

    return getTemplateById(templateId);
};

export const deleteAttribute = async (templateId: string, attributeId: string): Promise<Template | null> => {
    const existing = await getTemplateById(templateId);
    if (!existing) return null;

    const updatedAttributes = existing.attributes.filter(a => a.id !== attributeId);

    await db.update(templates)
        .set({ attributes: updatedAttributes, updatedAt: new Date() })
        .where(eq(templates.id, templateId));

    return getTemplateById(templateId);
};

export const updateAllAttributes = async (templateId: string, attributes: DynamicAttribute[]): Promise<Template | null> => {
    const existing = await getTemplateById(templateId);
    if (!existing) return null;

    await db.update(templates)
        .set({ attributes: attributes, updatedAt: new Date() })
        .where(eq(templates.id, templateId));

    return getTemplateById(templateId);
};


// Helper to cast DB result to correct types
function toTemplate(dbRecord: any): Template {
    return {
        ...dbRecord,
        attributes: (dbRecord.attributes as DynamicAttribute[]) ?? [],
        format: 'pdf', // Hardcoded as we only support PDF
    };
}
