/**
 * Shared Package Entry Point
 *
 * Central export for all shared types, schemas, and utilities.
 *
 * @example
 * ```typescript
 * import { db, schema, CardSchema } from '@kanban/shared';
 * ```
 *
 * @module index
 */

export { config } from './config';
export type { Database } from './db';

// Database exports
export { db, schema, sqlite } from './db';
export type {
  Board,
  Card,
  Column,
  NewBoard,
  NewCard,
  NewColumn,
  NewUser,
  User,
} from './schema';

// Schema exports
export {
  boards,
  boardsRelations,
  cards,
  cardsRelations,
  columns,
  columnsRelations,
  users,
  usersRelations,
} from './schema';
export type {
  ApiResponse,
  DeepPartial,
  Nullable,
  OptimisticUpdate,
  RealtimeOperation,
  WebSocketMessage,
} from './types';

// Type/Validation exports
export {
  ApiResponseSchema,
  BoardSchema,
  BoardStatePayload,
  CardCreatePayload,
  CardMovePayload,
  CardSchema,
  CardUpdatePayload,
  ColumnReorderPayload,
  ColumnSchema,
  ErrorPayload,
  JoinBoardPayload,
  OrderIndexSchema,
  PresenceSyncPayload,
  UserSchema,
  WebSocketMessageSchema,
  WebSocketMessageType,
} from './types';
export * from './utils/ranking';
