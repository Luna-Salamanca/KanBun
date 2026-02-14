/**
 * Database Connection Module
 *
 * Establishes connection to SQLite database using bun:sqlite driver.
 * Provides singleton Drizzle ORM instance for database operations.
 *
 * @module db
 */

import { Database as SQLiteDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { config } from './config';
import * as schema from './schema';

/**
 * SQLite database instance
 * Uses Bun's native SQLite implementation for optimal performance
 */
export const sqlite = new SQLiteDatabase(config.DATABASE_URL);

sqlite.run('PRAGMA journal_mode = WAL;');
sqlite.run('PRAGMA foreign_keys = ON;');
sqlite.run('PRAGMA busy_timeout = 5000;');

/**
 * Drizzle ORM instance with schema
 *
 * Usage:
 * ```typescript
 * import { db } from '@kanban/shared/db';
 *
 * const boards = await db.query.boards.findMany();
 * ```
 */
export const db = drizzle(sqlite, {
  schema,
  logger: config.NODE_ENV === 'development',
});

/**
 * Type alias for database type
 */
export type Database = typeof db;

export { schema };
