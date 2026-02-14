import type { WebSocketMessage } from '@kanban/shared/types';

// Simple interface for connected client
interface ConnectedClient {
  ws: any;
  userId: string;
  boardId: string;
}

export class RoomManager {
  // Map boardId -> Set of clients
  private rooms: Map<string, Set<ConnectedClient>> = new Map();

  public joinRoom(boardId: string, userId: string, ws: any) {
    let room = this.rooms.get(boardId);
    if (!room) {
      room = new Set();
      this.rooms.set(boardId, room);
    }

    // Check for existing connection to avoid duplicates
    let existingClient: ConnectedClient | null = null;
    for (const c of room) {
      if (c.ws === ws) {
        existingClient = c;
        break;
      }
    }

    if (existingClient) {
      // Update metadata if needed, but don't add duplicate
      existingClient.userId = userId;
    } else {
      const client: ConnectedClient = { ws, userId, boardId };
      room.add(client);
      console.log(`[WS] User ${userId} joined room ${boardId}. Total: ${room.size}`);
    }

    // Broadcast presence update
    this.broadcastPresence(boardId);
  }

  public leaveRoom(boardId: string, ws: any) {
    const room = this.rooms.get(boardId);
    if (!room) return;

    for (const client of room) {
      if (client.ws === ws) {
        room.delete(client);
        console.log(`[WS] User ${client.userId} left room ${boardId}. Total: ${room.size}`);
        break;
      }
    }

    if (room.size === 0) {
      this.rooms.delete(boardId);
    } else {
      this.broadcastPresence(boardId);
    }
  }

  public broadcast(boardId: string, message: WebSocketMessage, excludeWs?: any) {
    const room = this.rooms.get(boardId);
    if (!room) return;

    const payload = JSON.stringify(message);
    const clientsToRemove: ConnectedClient[] = [];

    for (const client of room) {
      if (client.ws !== excludeWs) {
        try {
          client.ws.send(payload);
        } catch (err) {
          console.error(`[WS] Failed to send to client ${client.userId}:`, err);
          clientsToRemove.push(client);
          try {
            client.ws.close();
          } catch {
            /* ignore */
          }
        }
      }
    }

    // Cleanup dead clients
    if (clientsToRemove.length > 0) {
      for (const c of clientsToRemove) {
        room.delete(c);
      }
      if (room.size === 0) {
        this.rooms.delete(boardId);
      } else {
        this.broadcastPresence(boardId);
      }
    }
  }

  private broadcastPresence(boardId: string) {
    const room = this.rooms.get(boardId);
    if (!room) return;

    const users = Array.from(room).map((c) => ({
      userId: c.userId,
      name: `User ${c.userId.slice(0, 4)}`,
    }));

    const message: WebSocketMessage = {
      type: 'PRESENCE_SYNC',
      payload: { users },
      timestamp: Date.now(),
    };

    this.broadcast(boardId, message);
  }
}

export const roomManager = new RoomManager();
