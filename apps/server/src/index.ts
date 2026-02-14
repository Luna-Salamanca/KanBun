import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { config } from '@kanban/shared/config';
import { Elysia } from 'elysia';
import { boardsController } from './controllers/boards';
import { cardsController } from './controllers/cards';
import { columnsController } from './controllers/columns';
import { usersController } from './controllers/users';
import { wsHandler } from './ws/handler';

const app = new Elysia()
  .use(cors())
  .use(usersController)
  .use(boardsController)
  .use(columnsController)
  .use(cardsController)
  .use(wsHandler)
  .onError(({ code, error, set }) => {
    console.error('[Server Error] Raw:', error);
    const message = (error as any).message || 'Internal Server Error';
    console.error('[Server Error] Formatted:', { code, message });
    if (code === 'VALIDATION' || (error as any).all) {
      set.status = 400;
      return {
        success: false,
        error: 'Validation Error',
        details: (error as any).all || error,
      };
    }
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { success: false, error: 'Not Found' };
    }
    console.error('[Server Error] Internal:', message, (error as any).stack);
    set.status = 500;
    return {
      success: false,
      error: 'Internal Server Error',
    };
  })
  .get('/', () => 'Hello Kanban!')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(openapi())
  .listen(config.PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
