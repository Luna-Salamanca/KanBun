/**
 * Database Seed Script
 *
 * Populates database with test data for development.
 * Run with: bun run seed.ts
 *
 * @module seed
 */

import { db, generateOrderIndex, sqlite } from './src';
import { boards, cards, columns, users } from './src/schema';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Seed database with test data
 */
async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clean existing data (respect foreign keys)
    await db.delete(cards);
    await db.delete(columns);
    await db.delete(boards);
    await db.delete(users);

    console.log('  ✓ Cleaned existing data');

    // Create test user
    const userId = generateUUID();
    await db.insert(users).values({
      id: userId,
      name: 'Demo User',
      email: 'demo@example.com',
      avatar: '#6366f1',
    });

    console.log('  ✓ Created test user');

    // Create sample board
    const boardId = generateUUID();
    await db.insert(boards).values({
      id: boardId,
      title: 'Project Alpha',
      description: 'A demo board to showcase the Kanban functionality',
      ownerId: userId,
    });

    console.log('  ✓ Created sample board');

    // Create columns
    const columnData = [
      { id: generateUUID(), title: 'To Do', color: '#ef4444' },
      { id: generateUUID(), title: 'In Progress', color: '#f59e0b' },
      { id: generateUUID(), title: 'Review', color: '#8b5cf6' },
      { id: generateUUID(), title: 'Done', color: '#10b981' },
    ];

    await db.insert(columns).values(
      columnData.map((col, idx) => ({
        ...col,
        boardId,
        orderIndex: generateOrderIndex(idx),
      })),
    );

    console.log('  ✓ Created columns');

    // Create sample cards
    const cardTitles = [
      ['Research competitors', 'Define MVP scope', 'Set up CI/CD'],
      ['Implement auth', 'Design database schema', 'Write API docs'],
      ['Code review: PR #42', 'Test WebSocket sync', 'Update dependencies'],
      ['Deploy to staging', 'Write README', 'Team sync meeting'],
    ];

    for (let colIdx = 0; colIdx < columnData.length; colIdx++) {
      const columnId = columnData[colIdx].id;
      const titles = cardTitles[colIdx];

      await db.insert(cards).values(
        titles.map((title, cardIdx) => ({
          id: generateUUID(),
          columnId,
          title,
          description: cardIdx === 0 ? 'This is a sample card with a description.' : undefined,
          orderIndex: generateOrderIndex(cardIdx),
          assigneeId: cardIdx % 2 === 0 ? userId : undefined,
        })),
      );
    }

    console.log('  ✓ Created sample cards');

    console.log('\n Database seeded successfully!');
    console.log(`   Board ID: ${boardId}`);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    console.log(`   Access: ${baseUrl}/board/${boardId}`);
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

// Execute if run directly
if (import.meta.main) {
  await seed();
}

export { seed };
