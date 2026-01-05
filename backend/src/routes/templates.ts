
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
import { ApiResponse, DynamicAttribute } from '../types/index.js';
import { SYSTEM_ATTRIBUTE_IDS, isSystemAttribute } from '../config/system-attributes.js';


const router = Router();
const upload = multer(uploadConfig);

// Get all templates
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const templates = await getAllTemplates(userId);
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
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
        }

        if (!req.body.code) {
            return res.status(400).json({ success: false, error: 'Template code is required' });
        }

        // createTemplate now handles everything cleanly
        const template = await createTemplate(req.file, userId, {
            name: req.body.name,
            description: req.body.description,
            code: req.body.code
        });

        const response: ApiResponse = {
            success: true,
            data: template
        };
        res.status(201).json(response);
    } catch (error: any) {
        console.error('Create template error:', error);
        res.status(400).json({ success: false, error: error.message || 'Failed to create template' });
    }
});

// Update template details
router.patch('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { name, description } = req.body;
        const template = await updateTemplate(req.params.id, userId, { name, description });

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found or unauthorized' });
        }

        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update template' });
    }
});

// Get template by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        // Allows public templates even if not logged in (userId optional)
        const template = await getTemplateById(req.params.id, userId);
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
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const success = await deleteTemplate(req.params.id, userId);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Template not found or unauthorized' });
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
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { attributes } = req.body;
        if (!Array.isArray(attributes)) {
            return res.status(400).json({ success: false, error: 'Attributes must be an array' });
        }

        // Validate: User-created attributes cannot use system attribute IDs
        // System attributes (with matching IDs) are allowed - just ensure they're marked correctly
        for (const attr of attributes as DynamicAttribute[]) {
            if (isSystemAttribute(attr.id)) {
                // This is a system attribute ID - mark it as system to ensure consistency
                attr.isSystem = true;
            }
        }

        const template = await updateAllAttributes(req.params.id, userId, attributes);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found or unauthorized' });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update attributes' });
    }
});

// Add attribute
router.post('/:id/attributes', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const template = await addAttribute(req.params.id, userId, req.body);
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
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const template = await updateAttribute(req.params.id, userId, req.params.attrId, req.body);
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
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const template = await deleteAttribute(req.params.id, userId, req.params.attrId);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to remove attribute' });
    }
});

export default router;
