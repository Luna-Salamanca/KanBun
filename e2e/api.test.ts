import { describe, expect, it } from 'bun:test';
import { API_URL, setupTestServer } from './setup';

setupTestServer();

describe('API CRUD Operations', () => {
  let userId: string;
  let boardId: string;
  let columnId: string;
  let cardId: string;

  it('should create a new user', async () => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Test User' }),
    });

    expect(res.status).toBe(200);
    const user: any = await res.json();
    userId = user.id;
    expect(userId).toBeDefined();
  });

  it('should create a new board', async () => {
    const res = await fetch(`${API_URL}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Test Board',
        ownerId: userId,
        description: null,
      }),
    });

    expect(res.status).toBe(200);
    const board: any = await res.json();
    boardId = board.id;
    expect(boardId).toBeDefined();
  });

  it('should create a new column', async () => {
    const res = await fetch(`${API_URL}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: boardId,
        title: 'To Do',
        orderIndex: '0',
        color: null,
      }),
    });

    expect(res.status).toBe(200);
    const column: any = await res.json();
    columnId = column.id;
    expect(columnId).toBeDefined();
  });

  it('should create a new card', async () => {
    const res = await fetch(`${API_URL}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columnId: columnId,
        title: 'Task 1',
        orderIndex: '0',
        description: null,
        assigneeId: null,
      }),
    });

    expect(res.status).toBe(200);
    const card: any = await res.json();
    cardId = card.id;
    expect(cardId).toBeDefined();
  });

  it('should fetch board state', async () => {
    const res = await fetch(`${API_URL}/boards/${boardId}`);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.id).toBe(boardId);
    expect(data.columns.length).toBeGreaterThan(0);
  });

  it('should delete the card', async () => {
    const res = await fetch(`${API_URL}/cards/${cardId}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
  });
});
