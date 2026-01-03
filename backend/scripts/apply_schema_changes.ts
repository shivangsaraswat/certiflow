
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
    console.log('Applying schema changes...');

    try {
        // 1. Add columns if not exist
        await db.execute(sql`
        DO $$ 
        BEGIN 
            -- Certificates
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='certificates' AND column_name='user_id') THEN
                ALTER TABLE "certificates" ADD COLUMN "user_id" text;
                ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
            END IF;

            -- Bulk Jobs
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bulk_jobs' AND column_name='user_id') THEN
                ALTER TABLE "bulk_jobs" ADD COLUMN "user_id" text;
                ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
            END IF;

            -- Groups
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='groups' AND column_name='user_id') THEN
                ALTER TABLE "groups" ADD COLUMN "user_id" text;
                ALTER TABLE "groups" ADD CONSTRAINT "groups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
            END IF;

             -- Spreadsheets
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spreadsheets' AND column_name='user_id') THEN
                ALTER TABLE "spreadsheets" ADD COLUMN "user_id" text;
                ALTER TABLE "spreadsheets" ADD CONSTRAINT "spreadsheets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
            END IF;

             -- Templates
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='user_id') THEN
                ALTER TABLE "templates" ADD COLUMN "user_id" text;
                ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='is_public') THEN
                 ALTER TABLE "templates" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;
            END IF;

            -- Signatures Table
            CREATE TABLE IF NOT EXISTS "signatures" (
                "id" text PRIMARY KEY,
                "name" text NOT NULL,
                "filename" text NOT NULL,
                "file_url" text NOT NULL,
                "file_id" text,
                "user_id" text REFERENCES "public"."user"("id") ON DELETE cascade,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        END $$;
      `);
        console.log('Schema changes applied.');

        // 2. Backfill Data to Admin
        const ADMIN_ID = '93bb6c5b-3905-4d03-89db-0776eb6110be'; // From logs

        console.log(`Backfilling existing data to Admin ID: ${ADMIN_ID}`);

        await db.execute(sql`UPDATE "certificates" SET "user_id" = ${ADMIN_ID} WHERE "user_id" IS NULL`);
        await db.execute(sql`UPDATE "bulk_jobs" SET "user_id" = ${ADMIN_ID} WHERE "user_id" IS NULL`);
        await db.execute(sql`UPDATE "groups" SET "user_id" = ${ADMIN_ID} WHERE "user_id" IS NULL`);
        await db.execute(sql`UPDATE "spreadsheets" SET "user_id" = ${ADMIN_ID} WHERE "user_id" IS NULL`);
        await db.execute(sql`UPDATE "templates" SET "user_id" = ${ADMIN_ID} WHERE "user_id" IS NULL`);

        console.log('Backfill complete.');

    } catch (e) {
        console.error('Error applying changes:', e);
        process.exit(1);
    }

    process.exit(0);
}

main();
