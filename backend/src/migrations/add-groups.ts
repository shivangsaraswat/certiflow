/**
 * Migration script to add groups feature
 * Run with: npx tsx src/migrations/add-groups.ts
 */
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
    console.log('Starting migration...');

    try {
        // Step 1: Add code column to templates (nullable initially)
        console.log('Adding code column to templates...');
        await sql`ALTER TABLE templates ADD COLUMN IF NOT EXISTS code text`;

        // Step 2: Create groups table
        console.log('Creating groups table...');
        await sql`
            CREATE TABLE IF NOT EXISTS groups (
                id text PRIMARY KEY,
                name text NOT NULL,
                description text,
                template_id text NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
                created_at timestamp DEFAULT now() NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL
            )
        `;

        // Step 3: Add new columns to certificates
        console.log('Adding columns to certificates...');
        await sql`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS group_id text REFERENCES groups(id) ON DELETE SET NULL`;
        await sql`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS recipient_email text`;

        // Step 4: Add group_id to bulk_jobs
        console.log('Adding group_id to bulk_jobs...');
        await sql`ALTER TABLE bulk_jobs ADD COLUMN IF NOT EXISTS group_id text REFERENCES groups(id) ON DELETE SET NULL`;

        // Step 5: Update existing templates with auto-generated codes
        console.log('Generating codes for existing templates...');
        await sql`
            UPDATE templates 
            SET code = UPPER(REPLACE(SUBSTRING(name, 1, 5), ' ', ''))
            WHERE code IS NULL
        `;

        // Step 6: Make code column NOT NULL
        console.log('Making code column NOT NULL...');
        await sql`ALTER TABLE templates ALTER COLUMN code SET NOT NULL`;

        // Step 7: Add unique constraint (if not exists)
        console.log('Adding unique constraint to code...');
        try {
            await sql`ALTER TABLE templates ADD CONSTRAINT templates_code_unique UNIQUE (code)`;
        } catch (e: any) {
            if (!e.message?.includes('already exists')) {
                throw e;
            }
            console.log('Unique constraint already exists, skipping...');
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
