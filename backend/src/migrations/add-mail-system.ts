/**
 * Migration: Add Mail System Tables
 * 
 * This migration:
 * 1. Modifies groups table to make templateId nullable and add new columns
 * 2. Creates group_smtp_config table for encrypted SMTP credentials
 * 3. Creates mail_jobs table for async mail tracking
 * 4. Creates mail_logs table for permanent email history
 */

import { db } from '../lib/db.js';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Starting mail system migration...');

    try {
        // 1. Modify groups table
        console.log('1. Modifying groups table...');

        // Make templateId nullable (alter column to drop NOT NULL)
        await db.execute(sql`
            ALTER TABLE groups 
            ALTER COLUMN template_id DROP NOT NULL
        `);

        // Add new columns to groups
        await db.execute(sql`
            ALTER TABLE groups 
            ADD COLUMN IF NOT EXISTS selected_sheet_tab TEXT,
            ADD COLUMN IF NOT EXISTS column_mapping JSONB,
            ADD COLUMN IF NOT EXISTS email_template_html TEXT,
            ADD COLUMN IF NOT EXISTS email_subject TEXT
        `);

        console.log('   ✓ Groups table modified');

        // 2. Create group_smtp_config table
        console.log('2. Creating group_smtp_config table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS group_smtp_config (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL UNIQUE REFERENCES groups(id) ON DELETE CASCADE,
                smtp_host TEXT NOT NULL,
                smtp_port INTEGER NOT NULL,
                smtp_email TEXT NOT NULL,
                smtp_password TEXT NOT NULL,
                encryption_type TEXT NOT NULL,
                sender_name TEXT,
                reply_to TEXT,
                is_configured BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `);
        console.log('   ✓ group_smtp_config table created');

        // 3. Create mail_jobs table
        console.log('3. Creating mail_jobs table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS mail_jobs (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                total_recipients INTEGER NOT NULL,
                sent_count INTEGER NOT NULL DEFAULT 0,
                failed_count INTEGER NOT NULL DEFAULT 0,
                pending_count INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                recipient_data JSONB,
                errors JSONB,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `);
        console.log('   ✓ mail_jobs table created');

        // 4. Create mail_logs table
        console.log('4. Creating mail_logs table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS mail_logs (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                mail_job_id TEXT REFERENCES mail_jobs(id) ON DELETE SET NULL,
                recipient_email TEXT NOT NULL,
                recipient_name TEXT,
                subject TEXT NOT NULL,
                status TEXT NOT NULL,
                error_message TEXT,
                sent_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `);
        console.log('   ✓ mail_logs table created');

        // Create indexes for performance
        console.log('5. Creating indexes...');
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_mail_jobs_group_id ON mail_jobs(group_id);
            CREATE INDEX IF NOT EXISTS idx_mail_logs_group_id ON mail_logs(group_id);
            CREATE INDEX IF NOT EXISTS idx_mail_logs_mail_job_id ON mail_logs(mail_job_id);
            CREATE INDEX IF NOT EXISTS idx_mail_logs_status ON mail_logs(status);
        `);
        console.log('   ✓ Indexes created');

        console.log('\n✅ Mail system migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
