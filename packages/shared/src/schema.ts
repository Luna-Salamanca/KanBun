/**
 * Database Schema Definitions
 *
 * Core schema for the Kanban application using Drizzle ORM.
 * Defines entities: users, boards, columns, and cards.
 *
 * Design Decisions:
 * - Uses text UUIDs for IDs (generated via crypto.randomUUID())
 * - Fractional indexing (lexorank-style) for ordering to avoid reordering conflicts
 * - Cascade deletes ensure data consistency when boards are removed
 * - Timestamps stored as integers (Unix ms) for cross-platform compatibility
 *
 * @module schema
 */

import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ============================================================================
// User Entity
// ============================================================================

/**
 * Users table - Represents collaborators in the system
 *
 * @property id - Unique identifier (UUID)
 * @property name - Display name
 * @property email - Optional email for future auth integration
 * @property avatar - URL or color code for avatar
 * @property createdAt - Unix timestamp (ms)
 */
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    avatar: text('avatar'), // URL or color hex for avatar generation
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)],
);

// ============================================================================
// Board Entity
// ============================================================================

/**
 * Boards table - Container for kanban columns
 *
 * @property id - Unique identifier (UUID)
 * @property title - Board name
 * @property description - Optional board description
 * @property ownerId - Creator reference
 * @property createdAt - Creation timestamp
 * @property updatedAt - Last modification timestamp
 */
export const boards = sqliteTable(
  'boards',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('boards_owner_idx').on(table.ownerId)],
);

// ============================================================================
// Column Entity
// ============================================================================

/**
 * Columns table - Vertical lanes within a board
 *
 * Uses fractional indexing (orderIndex as text) to allow infinite
 * insertions between items without re-indexing the entire column.
 * Format: "0", "1", "2" or "0|a", "0|b" for between-items.
 *
 * @property id - Unique identifier (UUID)
 * @property boardId - Parent board reference
 * @property title - Column header text
 * @property orderIndex - Lexicographic sort key (text-based fractional indexing)
 * @property color - Optional accent color
 * @property createdAt - Creation timestamp
 */
export const columns = sqliteTable(
  'columns',
  {
    id: text('id').primaryKey(),
    boardId: text('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    orderIndex: text('order_index').notNull(), // Lexorank-style fractional indexing
    color: text('color'), // Hex color for column accent
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('columns_board_idx').on(table.boardId),
    index('columns_order_idx').on(table.boardId, table.orderIndex),
  ],
);

// ============================================================================
// Card Entity
// ============================================================================

/**
 * Cards table - Individual tasks/items within columns
 *
 * @property id - Unique identifier (UUID)
 * @property columnId - Parent column reference
 * @property title - Card title/summary
 * @property description - Detailed content (supports markdown in future)
 * @property orderIndex - Position within column (fractional indexing)
 * @property assigneeId - Optional user assignment
 * @property createdAt - Creation timestamp
 * @property updatedAt - Last edit timestamp
 */
export const cards = sqliteTable(
  'cards',
  {
    id: text('id').primaryKey(),
    columnId: text('column_id')
      .notNull()
      .references(() => columns.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    orderIndex: text('order_index').notNull(), // Lexorank-style fractional indexing
    assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('cards_column_idx').on(table.columnId),
    index('cards_order_idx').on(table.columnId, table.orderIndex),
    index('cards_assignee_idx').on(table.assigneeId),
  ],
);

// ============================================================================
// Relations
// ============================================================================

export const usersRelations = relations(users, ({ many }: any) => ({
  boards: many(boards),
  assignedCards: many(cards),
}));

export const boardsRelations = relations(boards, ({ one, many }: any) => ({
  owner: one(users, {
    fields: [boards.ownerId],
    references: [users.id],
  }),
  columns: many(columns),
}));

export const columnsRelations = relations(columns, ({ one, many }: any) => ({
  board: one(boards, {
    fields: [columns.boardId],
    references: [boards.id],
  }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one }: any) => ({
  column: one(columns, {
    fields: [cards.columnId],
    references: [columns.id],
  }),
  assignee: one(users, {
    fields: [cards.assigneeId],
    references: [users.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type Column = typeof columns.$inferSelect;
export type NewColumn = typeof columns.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
