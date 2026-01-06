/**
 * Certificate Generation Backend
 * Entry point for the Express application
 * Updated to use Drizzle for database persistence
 */

import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { storage } from './services/storage.service.js';
import { loadSignatures } from './routes/files.js';
import routes from './routes/index.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { db } from './lib/db.js';

async function main() {
    const app = express();

    // ==========================================================================
    // Middleware
    // ==========================================================================

    // CORS - Allow frontend requests (supports multiple origins for production)
    app.use(cors({
        origin: config.frontendUrls,
        credentials: true,
    }));

    // Parse JSON bodies
    app.use(express.json());

    // Parse URL-encoded bodies
    app.use(express.urlencoded({ extended: true }));

    // Auth Middleware (Extracts x-user-id)
    app.use(authMiddleware); // Added authMiddleware

    // ==========================================================================
    // Initialize Services
    // ==========================================================================

    // Test database connection (Drizzle doesn't have explicit connect, but we can query)
    try {
        // Simple query to verify connection
        // @ts-ignore
        await db.execute('SELECT 1');
        console.log('✓ Database connected (Neon PostgreSQL via Drizzle)');
    } catch (error) {
        console.error('✗ Database connection failed:', error);
        process.exit(1);
    }

    // Create storage directories
    await storage.initialize();

    // Load signatures (still uses local files for now)
    await loadSignatures();

    // ==========================================================================
    // Routes
    // ==========================================================================

    // Root route - API info
    app.get('/', (req, res) => {
        res.json({
            success: true,
            message: 'CertiFlow API Server',
            version: '1.0.0',
            endpoints: {
                health: '/api/health',
                templates: '/api/templates',
                generate: '/api/generate',
                documentation: 'https://github.com/shivangsaraswat/certif'
            }
        });
    });

    // API routes
    app.use('/api', routes);

    // Not found handler
    app.use(notFoundHandler);

    // Error handler (must be last)
    app.use(errorHandler);

    // ==========================================================================
    // Graceful Shutdown
    // ==========================================================================

    const shutdown = async () => {
        console.log('\nShutting down...');
        // Pool closes automatically or we can force it if we exported it
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

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
        console.log('API Endpoints (Drizzle Powered):');
        console.log(`  GET  /api/health`);
        console.log(`  GET  /api/templates`);
        console.log(`  POST /api/templates`);
        console.log(`  POST /api/generate/single`);
        console.log(`  POST /api/generate/bulk`);
        console.log(`  GET  /api/history/certificates`);
        console.log(`  GET  /api/files/download/:type/:filename`);
        console.log('');
    });
}

main().catch(console.error);
