/**
 * Script to link existing certificates to a group
 * 
 * Usage: npx tsx src/migrations/link-certs-to-group.ts <groupId>
 * 
 * This will link all certificates that have the same templateId as the group
 * but no groupId set.
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function linkCertsToGroup(groupId: string) {
    console.log(`Linking certificates to group: ${groupId}`);

    // Get the group's template ID
    const groups = await sql`SELECT template_id FROM groups WHERE id = ${groupId}`;

    if (groups.length === 0) {
        console.error('Group not found!');
        process.exit(1);
    }

    const templateId = groups[0].template_id;
    console.log(`Group uses template: ${templateId}`);

    // Count certificates to update
    const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM certificates 
        WHERE template_id = ${templateId} 
        AND (group_id IS NULL OR group_id = '')
    `;
    console.log(`Found ${countResult[0].count} certificates to link`);

    // Update certificates
    const result = await sql`
        UPDATE certificates 
        SET group_id = ${groupId}
        WHERE template_id = ${templateId} 
        AND (group_id IS NULL OR group_id = '')
        RETURNING id
    `;

    console.log(`✅ Linked ${result.length} certificates to group ${groupId}`);
}

// Get group ID from command line
const groupId = process.argv[2];
if (!groupId) {
    console.error('Usage: npx tsx src/migrations/link-certs-to-group.ts <groupId>');
    process.exit(1);
}

linkCertsToGroup(groupId);
