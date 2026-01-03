
import { Router } from 'express';
import multer from 'multer';
import {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    deleteTemplate,
    updateTemplate,
    updateAllAttributes,
    addAttribute,
    updateAttribute,
    deleteAttribute
} from '../services/template.service.js';
import { uploadConfig } from '../middleware/upload.js';
import { ApiResponse } from '../types/index.js';

const router = Router();
const upload = multer(uploadConfig);

// Get all templates
router.get('/', async (req, res) => {
    try {
        const templates = await getAllTemplates();
        const response: ApiResponse = {
            success: true,
            data: templates
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
});

// Create new template
router.post('/', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
        }

        // createTemplate now handles everything cleanly
        const template = await createTemplate(req.file, {
            name: req.body.name,
            description: req.body.description
        });

        const response: ApiResponse = {
            success: true,
            data: template
        };
        res.status(201).json(response);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ success: false, error: 'Failed to create template' });
    }
});

// Update template details
router.patch('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const template = await updateTemplate(req.params.id, { name, description });

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update template' });
    }
});

// Get template by ID
router.get('/:id', async (req, res) => {
    try {
        const template = await getTemplateById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        const response: ApiResponse = {
            success: true,
            data: template
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch template' });
    }
});

// Delete template
router.delete('/:id', async (req, res) => {
    try {
        const success = await deleteTemplate(req.params.id);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
});

// =============================================================================
// Attribute Management Routes
// =============================================================================

// Update ALL attributes (Bulk Save from Editor)
router.put('/:id/attributes', async (req, res) => {
    try {
        const { attributes } = req.body;
        if (!Array.isArray(attributes)) {
            return res.status(400).json({ success: false, error: 'Attributes must be an array' });
        }

        const template = await updateAllAttributes(req.params.id, attributes);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update attributes' });
    }
});

// Add attribute
router.post('/:id/attributes', async (req, res) => {
    try {
        const template = await addAttribute(req.params.id, req.body);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add attribute' });
    }
});

// Update attribute
router.put('/:id/attributes/:attrId', async (req, res) => {
    try {
        const template = await updateAttribute(req.params.id, req.params.attrId, req.body);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template or attribute not found' });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update attribute' });
    }
});

// Remove attribute
router.delete('/:id/attributes/:attrId', async (req, res) => {
    try {
        const template = await deleteAttribute(req.params.id, req.params.attrId);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to remove attribute' });
    }
});

export default router;
