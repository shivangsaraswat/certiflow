/**
 * Template Routes
 * API endpoints for template CRUD and attribute management
 * Updated for dynamic attributes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error-handler.js';
import { uploadTemplate } from '../middleware/upload.js';
import { storage } from '../services/storage.service.js';
import {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    updateTemplateAttributes,
    addAttribute,
    removeAttribute,
    deleteTemplate,
} from '../services/template.service.js';
import { ApiResponse, Template, DynamicAttribute } from '../types/index.js';

const router = Router();

/**
 * GET /api/templates
 * List all templates
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const templates = getAllTemplates();

    const response: ApiResponse<Template[]> = {
        success: true,
        data: templates,
    };

    res.json(response);
}));

/**
 * GET /api/templates/:id
 * Get a single template by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const template = getTemplateById(id);

    if (!template) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const response: ApiResponse<Template> = {
        success: true,
        data: template,
    };

    res.json(response);
}));

/**
 * POST /api/templates
 * Create a new template (uploads PDF)
 */
router.post('/', uploadTemplate, asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError('Template file is required', 400, 'FILE_REQUIRED');
    }

    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Template name is required', 400, 'NAME_REQUIRED');
    }

    const template = await createTemplate(req.file, name.trim(), description?.trim());

    const response: ApiResponse<Template> = {
        success: true,
        data: template,
    };

    res.status(201).json(response);
}));

/**
 * PUT /api/templates/:id
 * Update template metadata (name, description)
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const template = await updateTemplate(id, { name, description });

    if (!template) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const response: ApiResponse<Template> = {
        success: true,
        data: template,
    };

    res.json(response);
}));

/**
 * PUT /api/templates/:id/attributes
 * Update all template attributes (from visual editor)
 * This replaces all existing attributes with the new array
 */
router.put('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const attributes: DynamicAttribute[] = req.body.attributes;

    if (!Array.isArray(attributes)) {
        throw new AppError('Attributes array is required', 400, 'ATTRIBUTES_REQUIRED');
    }

    const template = await updateTemplateAttributes(id, attributes);

    if (!template) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const response: ApiResponse<Template> = {
        success: true,
        data: template,
    };

    res.json(response);
}));

/**
 * POST /api/templates/:id/attributes
 * Add a new attribute to the template
 */
router.post('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const attribute = req.body;

    if (!attribute || !attribute.name || !attribute.placeholder) {
        throw new AppError('Attribute name and placeholder are required', 400, 'INVALID_ATTRIBUTE');
    }

    const template = await addAttribute(id, attribute);

    if (!template) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const response: ApiResponse<Template> = {
        success: true,
        data: template,
    };

    res.status(201).json(response);
}));

/**
 * DELETE /api/templates/:id/attributes/:attrId
 * Remove an attribute from the template
 */
router.delete('/:id/attributes/:attrId', asyncHandler(async (req: Request, res: Response) => {
    const { id, attrId } = req.params;

    const template = await removeAttribute(id, attrId);

    if (!template) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const response: ApiResponse<Template> = {
        success: true,
        data: template,
    };

    res.json(response);
}));

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await deleteTemplate(id);

    if (!deleted) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
    };

    res.json(response);
}));

/**
 * GET /api/templates/:id/preview
 * Get template file URL for preview
 */
router.get('/:id/preview', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const template = getTemplateById(id);

    if (!template) {
        throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const previewUrl = storage.getUrl('templates', template.filename);

    const response: ApiResponse<{ previewUrl: string }> = {
        success: true,
        data: { previewUrl },
    };

    res.json(response);
}));

export default router;
