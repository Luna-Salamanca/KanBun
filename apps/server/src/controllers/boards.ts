import { BoardSchema } from '@kanban/shared/types';
import { eq, inArray } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db, schema } from '../db';

export const boardsController = new Elysia({ prefix: '/boards' })
  .get('/', async () => {
    return await db.query.boards.findMany();
  })
  .post(
    '/',
    async ({ body }) => {
      console.log('[Boards API] POST body:', JSON.stringify(body));
      // Basic creation - ownerId would typically come from auth context
      try {
        const values = {
          ...body,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log('[Boards API] Inserting values:', JSON.stringify(values));
        const result = await db.insert(schema.boards).values(values).returning();
        console.log('[Boards API] Full Result:', JSON.stringify(result));
        const newBoard = result[0];
        if (!newBoard) {
          throw new Error(
            'Boards insert did not return created row; possible DB misconfiguration: .returning() not supported',
          );
        }
        console.log('[Boards API] Created board:', JSON.stringify(newBoard));
        return newBoard;
      } catch (err) {
        console.error('[Boards API] Error:', err);
        throw err;
      }
    },
    {
      body: BoardSchema.omit({ id: true, createdAt: true, updatedAt: true }),
    },
  )
  .get('/:id', async ({ params: { id }, set }) => {
    // Fetch Board
    const rows = await db.select().from(schema.boards).where(eq(schema.boards.id, id));
    const board = rows[0];
    if (!board) {
      set.status = 404;
      return 'Board not found';
    }

    // Fetch Columns
    const columns = await db
      .select()
      .from(schema.columns)
      .where(eq(schema.columns.boardId, id))
      .orderBy(schema.columns.orderIndex);

    // Fetch Cards for these columns
    const columnIds = columns.map((c) => c.id);
    const cards =
      columnIds.length > 0
        ? await db.select().from(schema.cards).where(inArray(schema.cards.columnId, columnIds))
        : [];

    // Assemble
    const columnsWithCards = columns.map((col) => ({
      ...col,
      cards: cards
        .filter((c) => c.columnId === col.id)
        .sort((a, b) => {
          const numA = parseFloat(a.orderIndex);
          const numB = parseFloat(b.orderIndex);
          if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            return numA - numB;
          }
          return a.orderIndex.localeCompare(b.orderIndex);
        }),
    }));

    return {
      ...board,
      columns: columnsWithCards,
    };
  });
