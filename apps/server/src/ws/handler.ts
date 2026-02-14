import { WebSocketMessageSchema } from '@kanban/shared/types';
import { Elysia } from 'elysia';
import { wsActions } from './actions';
import { roomManager } from './manager';

interface WSData {
  boardId?: string;
  userId?: string;
}

export const wsHandler = new Elysia().ws('/ws', {
  open(ws) {
    const data = ws.data as WSData;
    data.boardId = undefined;
    data.userId = undefined;
  },
  async message(ws, message: any) {
    if (process.env.DEBUG_WS) {
      console.log('[WS] Raw Message Received:', JSON.stringify(message));
    }
    const data = ws.data as WSData;

    // Parse with Zod
    const parse = WebSocketMessageSchema.safeParse(message);
    if (!parse.success) {
      console.error('[WS] Zod Parse Failed:', parse.error.format());
      ws.send(
        JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Invalid format', details: parse.error.format() },
        }),
      );
      return;
    }

    const { type, payload, userId } = parse.data;

    try {
      switch (type) {
        case 'JOIN_BOARD':
          if (
            payload &&
            typeof payload === 'object' &&
            'boardId' in payload &&
            'userId' in payload &&
            typeof (payload as any).boardId === 'string' &&
            typeof (payload as any).userId === 'string'
          ) {
            const { boardId, userId: joinUserId } = payload as { boardId: string; userId: string };
            data.boardId = boardId;
            data.userId = joinUserId;
            roomManager.joinRoom(boardId, joinUserId, ws);

            // Fetch and send initial state
            try {
              const state = await wsActions.getBoardState(boardId);
              if (state) {
                ws.send(
                  JSON.stringify({
                    type: 'BOARD_STATE',
                    payload: state,
                    timestamp: Date.now(),
                  }),
                );
              }
            } catch (err: any) {
              console.error(`[WS] Error fetching board state:`, err);
              ws.send(
                JSON.stringify({
                  type: 'ERROR',
                  payload: {
                    type: 'error',
                    reason: 'failed_to_load_board',
                    message: err.message,
                  },
                }),
              );
            }
          }
          break;
        case 'LEAVE_BOARD':
          if (data.boardId) {
            roomManager.leaveRoom(data.boardId, ws);
            data.boardId = undefined;
            data.userId = undefined;
          }
          break;
        case 'CARD_MOVE':
          if (data.boardId) {
            const movePayload = payload as any;
            await wsActions.moveCard(movePayload, userId ?? 'system');
            roomManager.broadcast(
              data.boardId,
              { type, payload, timestamp: Date.now(), userId },
              ws,
            );
          }
          break;
        case 'CARD_CREATE':
          if (data.boardId) {
            const createPayload = payload as any;
            const newCard = await wsActions.createCard(createPayload, userId ?? 'system');

            const createdMsg = {
              type: 'CARD_CREATED',
              payload: newCard,
              timestamp: Date.now(),
              userId,
            } as const;

            // Send to creator specifically
            ws.send(JSON.stringify(createdMsg));

            // Broadcast to others
            roomManager.broadcast(data.boardId, createdMsg, ws);
          }
          break;
        case 'CARD_UPDATE':
          if (data.boardId) {
            const updatePayload = payload as any;
            await wsActions.updateCard(updatePayload, userId ?? 'system');

            const msg = { type, payload, timestamp: Date.now(), userId };
            ws.send(JSON.stringify(msg));

            roomManager.broadcast(data.boardId, msg, ws);
          }
          break;
        default:
          if (process.env.DEBUG_WS) {
            console.warn('[WS] Unknown message type:', type);
          }
      }
    } catch (err: any) {
      console.error(`[WS] Error handling message ${type}:`, err);
      ws.send(
        JSON.stringify({
          type: 'ERROR',
          payload: {
            message: 'Operation failed',
            details: 'Internal server error',
            originalType: type,
          },
          timestamp: Date.now(),
          userId,
        }),
      );
    }
  },
  close(ws) {
    const data = ws.data as WSData;
    if (data.boardId) {
      roomManager.leaveRoom(data.boardId, ws);
    }
    console.log('[WS] Connection closed');
  },
});
