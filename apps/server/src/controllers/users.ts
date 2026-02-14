import { Elysia, t } from 'elysia';
import { db, schema } from '../db';

export const usersController = new Elysia({ prefix: '/users' })
  .onBeforeHandle(({ request, path }) => {
    console.log(`[Users] Request: ${request.method} ${path}`);
  })
  .post(
    '/',
    async ({ body }) => {
      const { name } = body;
      const [newUser] = await db
        .insert(schema.users)
        .values({
          name,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        })
        .returning();
      return newUser;
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  );
