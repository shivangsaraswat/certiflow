
import { db } from './src/lib/db.js';
import { templates } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import { renderCertificate } from './src/engine/renderer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugTemplate() {
    try {
        const groupId = '45c10229-ea59-4a05-be5d-cbeee56f3df7';
        console.log(`Fetching Group ${groupId}...`);

        const { groups } = await import('./src/db/schema.js');
        const group = await db.query.groups.findFirst({
            where: eq(groups.id, groupId)
        });

        if (!group) {
            console.error('Group not found');
            process.exit(1);
        }
        console.log('Group Template ID:', group.templateId);
        console.log('Group Owner ID:', group.userId);

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

debugTemplate();
