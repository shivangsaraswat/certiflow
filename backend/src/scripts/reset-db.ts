
import { db } from '../lib/db.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function reset() {
    console.log('🗑️  Resetting database schema...');

    // Drop all tables in public schema
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    await db.execute(sql`CREATE SCHEMA public;`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`); // standard grant
    await db.execute(sql`COMMENT ON SCHEMA public IS 'standard public schema';`);

    console.log('✅ Database reset complete.');
    process.exit(0);
}

reset().catch(err => {
    console.error('Reset failed:', err);
    process.exit(1);
});
