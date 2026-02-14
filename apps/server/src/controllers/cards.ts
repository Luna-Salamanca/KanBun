import { CardSchema } from '@kanban/shared/types';
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db, schema } from '../db';

export const cardsController = new Elysia({ prefix: '/cards' })
  .post(
    '/',
    async ({ body }) => {
      const [newCard] = await db
        .insert(schema.cards)
        .values({
          ...body,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return newCard;
    },
    {
      body: CardSchema.omit({ id: true, createdAt: true, updatedAt: true }),
    },
  )
  .patch(
    '/:id',
    async ({ params: { id }, body, set }) => {
      const [updatedCard] = await db
        .update(schema.cards)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(schema.cards.id, id))
        .returning();
      if (!updatedCard) {
        set.status = 404;
        return { message: 'Card not found' };
      }
      return updatedCard;
    },
    {
      body: CardSchema.omit({
        id: true,
        columnId: true,
        createdAt: true,
        updatedAt: true,
      }).partial(),
    },
  )
  .delete('/:id', async ({ params: { id }, set }) => {
    const deleted = await db.delete(schema.cards).where(eq(schema.cards.id, id)).returning();
    if (deleted.length === 0) {
      set.status = 404;
      return { message: 'Card not found' };
    }
    return { success: true };
  });
