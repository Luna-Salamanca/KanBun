import type {
  CardCreatePayload,
  CardMovePayload,
  CardUpdatePayload,
  ColumnReorderPayload,
} from '@kanban/shared/types';
import { eq, inArray } from 'drizzle-orm';
import { db, schema } from '../db';

export const wsActions = {
  async moveCard(payload: typeof CardMovePayload._type, _userId: string) {
    // TODO: Verify user permission
    if (!_userId) throw new Error('Unauthorized');

    const result = await db
      .update(schema.cards)
      .set({
        columnId: payload.targetColumnId,
        orderIndex: payload.newOrderIndex,
        updatedAt: new Date(),
      })
      .where(eq(schema.cards.id, payload.cardId))
      .returning({ id: schema.cards.id });

    if (result.length === 0) {
      throw new Error('Card not found or not updated');
    }

    return { success: true };
  },

  async createCard(payload: typeof CardCreatePayload._type, _userId: string) {
    const [card] = await db
      .insert(schema.cards)
      .values({
        id: crypto.randomUUID(),
        columnId: payload.columnId,
        title: payload.title,
        description: payload.description ?? null,
        orderIndex: payload.orderIndex,
      })
      .returning();
    return card;
  },

  async updateCard(payload: typeof CardUpdatePayload._type, _userId: string) {
    if (!_userId) throw new Error('Unauthorized');

    const updates: Partial<typeof schema.cards.$inferSelect> = {
      updatedAt: new Date(),
    };
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.assigneeId !== undefined) updates.assigneeId = payload.assigneeId;

    const result = await db
      .update(schema.cards)
      .set(updates)
      .where(eq(schema.cards.id, payload.cardId))
      .returning();

    if (result.length === 0) {
      throw new Error('Card not found or not updated');
    }

    return result[0];
  },

  async reorderColumn(payload: typeof ColumnReorderPayload._type, _userId: string) {
    if (!_userId) throw new Error('Unauthorized');

    const result = await db
      .update(schema.columns)
      .set({
        orderIndex: payload.newOrderIndex,
      })
      .where(eq(schema.columns.id, payload.columnId))
      .returning({ id: schema.columns.id });

    if (result.length === 0) {
      throw new Error('Column not found or not updated');
    }
    return { success: true };
  },

  async getBoardState(boardId: string) {
    const rows = await db.select().from(schema.boards).where(eq(schema.boards.id, boardId)).all();
    const board = rows[0];

    if (!board) return null;

    const columns = await db.query.columns.findMany({
      where: eq(schema.columns.boardId, boardId),
      orderBy: (columns, { asc }) => [asc(columns.orderIndex)],
    });

    const colIds = columns.map((c) => c.id);
    const cards =
      colIds.length > 0
        ? await db.query.cards.findMany({
            where: inArray(schema.cards.columnId, colIds),
            orderBy: (cards, { asc }) => [asc(cards.orderIndex)],
          })
        : [];

    return {
      board,
      columns,
      cards,
      users: [],
    };
  },
};
