/**
 * Certificate Generation Backend
 * Entry point for the Express application
 */

import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { storage } from './services/storage.service.js';
import { loadTemplates } from './services/template.service.js';
import { loadSignatures } from './routes/files.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

async function main() {
    const app = express();

    // ==========================================================================
    // Middleware
    // ==========================================================================

    // CORS - Allow frontend requests
    app.use(cors({
        origin: config.frontendUrl,
        credentials: true,
    }));

    // Parse JSON bodies
    app.use(express.json());

    // Parse URL-encoded bodies
    app.use(express.urlencoded({ extended: true }));

    // ==========================================================================
    // Initialize Services
    // ==========================================================================

    // Create storage directories
    await storage.initialize();

    // Load existing data
    await loadTemplates();
    await loadSignatures();

    // ==========================================================================
    // Routes
    // ==========================================================================

    // API routes
    app.use('/api', routes);

    // Not found handler
    app.use(notFoundHandler);

    // Error handler (must be last)
    app.use(errorHandler);

    // ==========================================================================
    // Start Server
    // ==========================================================================

    app.listen(config.port, () => {
        console.log('');
        console.log('🎓 Certificate Generator Backend');
        console.log('================================');
        console.log(`✓ Server running on http://localhost:${config.port}`);
        console.log(`✓ Environment: ${config.nodeEnv}`);
        console.log(`✓ Frontend URL: ${config.frontendUrl}`);
        console.log('');
        console.log('API Endpoints:');
        console.log(`  GET  /api/health`);
        console.log(`  GET  /api/templates`);
        console.log(`  POST /api/templates`);
        console.log(`  POST /api/generate/single`);
        console.log(`  POST /api/generate/bulk`);
        console.log(`  GET  /api/files/download/:type/:filename`);
        console.log('');
    });
}

main().catch(console.error);
