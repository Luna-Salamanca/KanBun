/**
 * Type Definitions & Zod Schemas
 *
 * Centralized type definitions and validation schemas used across
 * the entire application. Shared between server and client for
 * end-to-end type safety.
 *
 * @module types
 */

import { z } from 'zod';
import type { Board, Card, Column, NewBoard, NewCard, NewColumn, NewUser, User } from './schema';

// ============================================================================
// Entity Schemas (for API validation)
// ============================================================================

export const OrderIndexSchema = z
  .string()
  .regex(/^[0-9]+(\|[a-z]+)*$/, 'Invalid order index format');

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().nullable(),
  avatar: z.string().nullable(),
  createdAt: z.coerce.date(),
}) satisfies z.ZodType<User>;

export const BoardSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable(),
  ownerId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}) satisfies z.ZodType<Board>;

export const ColumnSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  title: z.string().min(1).max(200),
  orderIndex: OrderIndexSchema,
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable(),
  createdAt: z.coerce.date(),
}) satisfies z.ZodType<Column>;

export const CardSchema = z.object({
  id: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).nullable(),
  orderIndex: OrderIndexSchema,
  assigneeId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}) satisfies z.ZodType<Card>;

// ============================================================================
// WebSocket Message Types
// ============================================================================

export const WebSocketMessageType = z.enum([
  // Client -> Server
  'JOIN_BOARD',
  'LEAVE_BOARD',
  'CARD_MOVE',
  'CARD_CREATE',
  'CARD_UPDATE',
  'CARD_DELETE',
  'COLUMN_CREATE',
  'COLUMN_UPDATE',
  'COLUMN_DELETE',
  'COLUMN_REORDER',

  // Server -> Client
  'BOARD_STATE',
  'CARD_MOVED',
  'CARD_CREATED',
  'CARD_UPDATED',
  'CARD_DELETED',
  'COLUMN_CREATED',
  'COLUMN_UPDATED',
  'COLUMN_DELETED',
  'COLUMN_REORDERED',
  'PRESENCE_SYNC',
  'USER_JOINED',
  'USER_LEFT',
  'ERROR',
]);

export type WebSocketMessageType = z.infer<typeof WebSocketMessageType>;

// Base message structure
export const WebSocketMessageSchema = z.object({
  type: WebSocketMessageType,
  payload: z.unknown().optional(),
  timestamp: z
    .number()
    .int()
    .positive()
    .default(() => Date.now()),
  userId: z.string().uuid().optional(),
});

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// ============================================================================
// Specific Message Payloads
// ============================================================================

// Client -> Server: Join a board room
export const JoinBoardPayload = z.object({
  boardId: z.string().uuid(),
  userId: z.string().uuid(),
});

// Client -> Server: Move card between columns or reorder
export const CardMovePayload = z.object({
  cardId: z.string().uuid(),
  sourceColumnId: z.string().uuid(),
  targetColumnId: z.string().uuid(),
  newOrderIndex: OrderIndexSchema,
});

// Client -> Server: Update card content
export const CardUpdatePayload = z.object({
  cardId: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
});

// Client -> Server: Create new card
export const CardCreatePayload = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  orderIndex: OrderIndexSchema,
});

// Client -> Server: Reorder columns
export const ColumnReorderPayload = z.object({
  columnId: z.string().uuid(),
  newOrderIndex: OrderIndexSchema,
});

// Server -> Client: Presence update
export const PresenceSyncPayload = z.object({
  users: z.array(
    z.object({
      userId: z.string().uuid(),
      name: z.string(),
      avatar: z.string().optional(),
    }),
  ),
});

// Server -> Client: Full board state (initial load)
export const BoardStatePayload = z.object({
  board: BoardSchema,
  columns: z.array(ColumnSchema),
  cards: z.array(CardSchema),
  users: z.array(UserSchema),
});

// Server -> Client: Error response
export const ErrorPayload = z.object({
  code: z.enum(['UNAUTHORIZED', 'NOT_FOUND', 'VALIDATION_ERROR', 'CONFLICT', 'INTERNAL_ERROR']),
  message: z.string(),
  details: z.unknown().optional(),
});

// ============================================================================
// API Response Types
// ============================================================================

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ErrorPayload.optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: z.infer<typeof ErrorPayload>;
};

// ============================================================================
// Real-time Operation Types
// ============================================================================

export interface RealtimeOperation {
  id: string;
  type: 'move' | 'update' | 'create' | 'delete';
  entity: 'card' | 'column';
  timestamp: number;
  userId: string;
  payload: unknown;
}

export interface OptimisticUpdate {
  id: string;
  operation: RealtimeOperation;
  rollback: () => void;
  timestamp: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null | undefined;

export type { User, Board, Column, Card, NewUser, NewBoard, NewColumn, NewCard };
