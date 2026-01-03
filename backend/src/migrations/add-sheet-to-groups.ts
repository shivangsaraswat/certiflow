/**
 * Migration to add sheet_id column to groups table
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
    console.log('Adding sheet_id column to groups...');

    try {
        await sql`ALTER TABLE groups ADD COLUMN IF NOT EXISTS sheet_id TEXT REFERENCES spreadsheets(id) ON DELETE SET NULL`;
        console.log('✅ Added sheet_id column to groups');
    } catch (error) {
        console.log('Column may already exist:', error);
    }
}

migrate();
