# KanBun

> Real-time collaborative Kanban board using Bun, Elysia, and Drizzle

**KanBun** (Kanban + Bun) is a real-time collaborative kanban board to explore the BED stack.

## Tech Stack

**Core:**

- **[Bun](https://bun.sh/)** - Fast JS runtime and package manager
- **[Elysia](https://elysiajs.com/)** - Web framework with great TypeScript support
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe ORM for SQLite

**Also using:**

- TypeScript for type safety
- WebSockets for real-time updates
- Biome for linting/formatting
- SQLite as the database

## Project Structure

```text
kanbun/
├── apps/
│   └── server/              # Backend server
│       ├── src/
│       │   ├── controllers/ # API endpoints
│       │   ├── ws/          # WebSocket stuff
│       │   └── index.ts     # Entry point
│       └── package.json
├── packages/
│   └── shared/              # Shared code
│       ├── src/
│       │   ├── schema.ts    # DB schema
│       │   ├── types.ts     # TypeScript types
│       │   ├── config.ts
│       │   └── utils/
│       ├── drizzle/         # Migrations
│       ├── migrate.ts
│       └── seed.ts          # Test data
├── e2e/                     # Tests
│   ├── api.test.ts
│   └── ws.test.ts
├── Makefile
├── biome.json
└── package.json
```

## How It Works

### Monorepo Setup

Using Bun workspaces to split things up:

- `@kanban/server` - The backend API and WebSocket server
- `@kanban/shared` - Shared database schema and types

### Database

I'm using fractional indexing (like Jira's lexorank) for drag-and-drop ordering. The schema has:

- **Users** - People who can be assigned to cards
- **Boards** - Project boards
- **Columns** - The typical "To Do", "In Progress", "Done" lanes
- **Cards** - Individual tasks

Some choices I made:

- Text UUIDs instead of integers (easier to work with across systems)
- Cascade deletes so orphaned data gets cleaned up automatically
- Indexes on commonly queried fields
- Timestamps are unix time in milliseconds

### Real-Time Stuff

WebSocket connections handle the live updates. When someone moves a card or makes changes, everyone else sees it immediately.

## Getting Started

### What You Need

- [Bun](https://bun.sh/) latest
- [Make](https://www.gnu.org/software/make/) (optional but handy)

### Install

```bash
make install
```

### Database Setup

```bash
# Create migrations from the schema
make db-generate

# Run migrations
make db-migrate

# Add some test data
make db-seed

# Check out the DB in Drizzle Studio
make db-studio
```

### Run It

```bash
make dev
# or just: bun run dev
```

Server starts on `http://localhost:3000`

### Commands

| Command            | What it does                     |
| ------------------ | -------------------------------- |
| `make install`     | Install dependencies             |
| `make dev`         | Start dev server with hot reload |
| `make build`       | Build everything                 |
| `make lint`        | Lint and format with Biome       |
| `make type`        | TypeScript type checking         |
| `make test`        | Run all tests                    |
| `make test-ws`     | WebSocket tests only             |
| `make test-api`    | API tests only                   |
| `make clean`       | Clean build artifacts            |
| `make db-generate` | Generate migrations              |
| `make db-migrate`  | Run migrations                   |
| `make db-seed`     | Seed database                    |
| `make db-studio`   | Open Drizzle Studio              |

## Testing

Tests automatically start and stop the server, so you don't need to run it separately:

```bash
make test        # All tests
make test-ws     # Just WebSocket tests
make test-api    # Just API tests
```

## API

### REST Endpoints

Interactive API documentation is available at `http://localhost:3000/openapi` when the server is running.

### Core

- `GET /` - Health check
- `GET /health` - Server status

### Users

- `GET /users` - List all
- `POST /users` - Create one

### Boards

- `GET /boards` - List all
- `POST /boards` - Create one

### Columns

- `GET /columns` - List all
- `POST /columns` - Create one

### Cards

- `GET /cards` - List all
- `POST /cards` - Create one
- `PATCH /cards/:id` - Update
- `DELETE /cards/:id` - Delete

### WebSocket

Connect to `ws://localhost:3000/ws` for real-time updates.

## What's Working

- CRUD for boards, columns, and cards
- Real-time WebSocket updates
- Drag-and-drop ordering with fractional indexing
- User assignments
- Migrations and seeding
- Type-safe API
- E2E tests

## TODO

- Build a frontend (probably React)
- Add authentication
- Card comments
- File attachments
- Board templates
- Dark mode
- Import/export

## Config

Drop a `.env` in `apps/server/`:

```env
PORT=3000
DATABASE_URL=./kanban.db
```

Biome is set up with 2-space indentation, single quotes, and semicolons.

## Resources

- [Bun docs](https://bun.sh/docs)
- [Elysia docs](https://elysiajs.com/introduction.html)
- [Drizzle docs](https://orm.drizzle.team/docs/overview)
- [Fractional indexing explained](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/)

## License

MIT - Do whatever you want with it.

## Contributing

PRs welcome! This started as a way to learn the BED stack, so if you want to experiment with it too, go for it.

1. Fork it
2. Make a branch (`git checkout -b feature/cool-thing`)
3. Commit your changes
4. Push and open a PR

---

Built with the BED stack
