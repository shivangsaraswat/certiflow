/**
 * Template Service
 * Handles CRUD operations for PDF certificate templates
 * Updated for dynamic, user-defined attributes
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Template, DynamicAttribute } from '../types/index.js';
import { storage } from './storage.service.js';
import { getPDFMetadata } from '../engine/renderer.js';
import { config } from '../config/index.js';

// In-memory template store (in production, use a database)
const templates: Map<string, Template> = new Map();
const TEMPLATES_JSON_PATH = path.join(config.storage.root, 'templates.json');

/**
 * Load templates from JSON file on startup
 */
export async function loadTemplates(): Promise<void> {
    try {
        const data = await fs.readFile(TEMPLATES_JSON_PATH, 'utf-8');
        const templatesArray: Template[] = JSON.parse(data);
        templatesArray.forEach(t => templates.set(t.id, t));
        console.log(`✓ Loaded ${templates.size} templates`);
    } catch {
        console.log('✓ No existing templates found, starting fresh');
    }
}

/**
 * Save templates to JSON file
 */
async function saveTemplates(): Promise<void> {
    const templatesArray = Array.from(templates.values());
    await fs.writeFile(TEMPLATES_JSON_PATH, JSON.stringify(templatesArray, null, 2));
}

/**
 * Get all templates
 */
export function getAllTemplates(): Template[] {
    return Array.from(templates.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): Template | undefined {
    return templates.get(id);
}

/**
 * Create a new template from an uploaded PDF file
 * Starts with empty attributes - user adds them in the visual editor
 */
export async function createTemplate(
    file: Express.Multer.File,
    name: string,
    description?: string
): Promise<Template> {
    // Validate PDF file
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
        throw new Error('Only PDF files are supported as templates');
    }

    const id = uuidv4();
    const filename = `${id}.pdf`;

    // Get PDF metadata (page count, dimensions)
    const metadata = await getPDFMetadata(file.buffer);

    // Save the file
    const filepath = await storage.save(file.buffer, 'templates', filename);

    const template: Template = {
        id,
        name,
        description,
        filename,
        filepath,
        format: 'pdf',
        pageCount: metadata.pageCount,
        width: metadata.width,
        height: metadata.height,
        attributes: [],  // Start empty - user adds in visual editor
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    templates.set(id, template);
    await saveTemplates();

    return template;
}

/**
 * Update template metadata (name, description)
 */
export async function updateTemplate(
    id: string,
    updates: Partial<Pick<Template, 'name' | 'description'>>
): Promise<Template | undefined> {
    const template = templates.get(id);
    if (!template) return undefined;

    const updated: Template = {
        ...template,
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    templates.set(id, updated);
    await saveTemplates();

    return updated;
}

/**
 * Update template attributes (from visual editor)
 * This is the main method for saving attribute positions
 */
export async function updateTemplateAttributes(
    id: string,
    attributes: DynamicAttribute[]
): Promise<Template | undefined> {
    const template = templates.get(id);
    if (!template) return undefined;

    // Validate page numbers
    for (const attr of attributes) {
        if (attr.page < 1 || attr.page > template.pageCount) {
            throw new Error(
                `Invalid page number ${attr.page} for attribute "${attr.name}". Template has ${template.pageCount} page(s).`
            );
        }
    }

    const updated: Template = {
        ...template,
        attributes,
        updatedAt: new Date().toISOString(),
    };

    templates.set(id, updated);
    await saveTemplates();

    return updated;
}

/**
 * Add a single attribute to a template
 */
export async function addAttribute(
    id: string,
    attribute: Omit<DynamicAttribute, 'id'>
): Promise<Template | undefined> {
    const template = templates.get(id);
    if (!template) return undefined;

    const newAttribute: DynamicAttribute = {
        ...attribute,
        id: `attr_${uuidv4().substring(0, 8)}`,
    };

    const updated: Template = {
        ...template,
        attributes: [...template.attributes, newAttribute],
        updatedAt: new Date().toISOString(),
    };

    templates.set(id, updated);
    await saveTemplates();

    return updated;
}

/**
 * Remove an attribute from a template
 */
export async function removeAttribute(
    templateId: string,
    attributeId: string
): Promise<Template | undefined> {
    const template = templates.get(templateId);
    if (!template) return undefined;

    const updated: Template = {
        ...template,
        attributes: template.attributes.filter(a => a.id !== attributeId),
        updatedAt: new Date().toISOString(),
    };

    templates.set(templateId, updated);
    await saveTemplates();

    return updated;
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
    const template = templates.get(id);
    if (!template) return false;

    try {
        await storage.delete('templates', template.filename);
    } catch {
        // File might not exist, continue anyway
    }

    templates.delete(id);
    await saveTemplates();

    return true;
}
