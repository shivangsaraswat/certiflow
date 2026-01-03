/**
 * Script to link ALL orphan certificates (with no group) to their template's group
 * 
 * Usage: npx tsx src/migrations/link-all-orphan-certs.ts
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function linkOrphanCerts() {
    console.log('Finding orphan certificates...');

    // Find all certificates without a group_id
    const orphans = await sql`
        SELECT c.id, c.template_id, g.id as group_id, g.name as group_name
        FROM certificates c
        JOIN groups g ON c.template_id = g.template_id
        WHERE c.group_id IS NULL OR c.group_id = ''
    `;

    console.log(`Found ${orphans.length} orphan certificates with matching groups`);

    if (orphans.length === 0) {
        console.log('No orphan certificates to update!');
        return;
    }

    // Update each certificate
    for (const cert of orphans) {
        await sql`UPDATE certificates SET group_id = ${cert.group_id} WHERE id = ${cert.id}`;
        console.log(`Linked cert ${cert.id} to group "${cert.group_name}"`);
    }

    console.log(`✅ Done! Linked ${orphans.length} certificates to their groups.`);
}

linkOrphanCerts();
