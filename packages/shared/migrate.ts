/**
 * Database Migration Script
 *
 * Executes Drizzle ORM migrations to synchronize database schema.
 * Run with: bun run migrate.ts
 *
 * @module migrate
 */

import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db, sqlite } from './src';

/**
 * Run pending migrations
 */
async function runMigrations() {
  console.log('🔄 Running database migrations...');

  try {
    // Run migrations from the drizzle folder
    migrate(db, { migrationsFolder: './drizzle' });

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

if (import.meta.main) {
  runMigrations();
}

export { runMigrations };
