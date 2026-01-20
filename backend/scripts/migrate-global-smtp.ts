import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Applying global SMTP configuration migration...');

        // Create global_smtp_config table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "global_smtp_config" (
                "id" text PRIMARY KEY NOT NULL,
                "user_id" text NOT NULL,
                "name" text NOT NULL,
                "smtp_host" text NOT NULL,
                "smtp_port" integer NOT NULL,
                "smtp_email" text NOT NULL,
                "smtp_password" text NOT NULL,
                "encryption_type" text NOT NULL,
                "sender_name" text,
                "reply_to" text,
                "is_default" boolean DEFAULT false NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        console.log('✓ Created global_smtp_config table');

        // Add foreign key (ignore if exists)
        try {
            await client.query(`
                ALTER TABLE "global_smtp_config" 
                ADD CONSTRAINT "global_smtp_config_user_id_user_id_fk" 
                FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") 
                ON DELETE cascade ON UPDATE no action;
            `);
            console.log('✓ Added foreign key constraint');
        } catch (e: any) {
            if (e.code === '42710') {
                console.log('✓ Foreign key already exists');
            } else {
                throw e;
            }
        }

        // Add global_smtp_config_id to groups
        try {
            await client.query(`
                ALTER TABLE "groups" ADD COLUMN "global_smtp_config_id" text;
            `);
            console.log('✓ Added global_smtp_config_id column to groups');
        } catch (e: any) {
            if (e.code === '42701') {
                console.log('✓ Column already exists');
            } else {
                throw e;
            }
        }

        console.log('Migration completed successfully!');
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(console.error);
