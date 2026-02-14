import { ColumnSchema } from '@kanban/shared/types';
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db, schema } from '../db';

export const columnsController = new Elysia({ prefix: '/columns' })
  .post(
    '/',
    async ({ body }) => {
      const [newColumn] = await db
        .insert(schema.columns)
        .values({
          ...body,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        })
        .returning();
      return newColumn;
    },
    {
      body: ColumnSchema.omit({ id: true, createdAt: true }),
    },
  )
  .patch(
    '/:id',
    async ({ params: { id }, body }) => {
      const [updatedColumn] = await db
        .update(schema.columns)
        .set(body)
        .where(eq(schema.columns.id, id))
        .returning();
      if (!updatedColumn) throw new Error('Column not found');
      return updatedColumn;
    },
    {
      body: ColumnSchema.omit({ id: true, boardId: true, createdAt: true }).partial(),
    },
  )
  .delete('/:id', async ({ params: { id } }) => {
    await db.delete(schema.columns).where(eq(schema.columns.id, id));
    return { success: true };
  });
