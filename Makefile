# ==============================================================================
# Real-time Collaborative Kanban Board - Project Makefile
# ==============================================================================

.PHONY: help install dev build lint test clean db-generate db-migrate db-seed db-studio

# Default target
help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make build        - Build all packages and apps"
	@echo "  make lint         - Lint code"
	@echo "  make type         - Type-check code (tsc)"
	@echo "  make typecheck    - Alias for make type"
	@echo "  make test         - Run all tests (unit + E2E)"
	@echo "  make test-ws      - Run WebSocket E2E tests (requires 'make dev')"
	@echo "  make test-api     - Run API CRUD tests (requires 'make dev')"
	@echo "  make clean        - Clean build artifacts and node_modules"
	@echo ""
	@echo "Database commands (SQLite):"
	@echo "  make db-generate  - Generate SQL migrations from schema"
	@echo "  make db-migrate   - Apply migrations to the database"
	@echo "  make db-seed      - Seed the database with test data"
	@echo "  make db-studio    - Open Drizzle Studio to view data"

# ==============================================================================
# Project Management
# ==============================================================================

install:
	bun install

dev:
	bun run dev

build:
	bun run build

lint:
	@echo "--- Linting and Formatting with Biome ---"
	bun run check

type:
	@echo "--- Type Checking ---"
	bun run typecheck

typecheck: type

test:
	@echo "--- Running Centralized E2E Tests ---"
	@bun test e2e --test-concurrency 1

test-ws:
	@bun test e2e/ws.test.ts --test-concurrency 1

test-api:
	@bun test e2e/api.test.ts --test-concurrency 1

# Helper to handle Windows vs Unix cleanup
ifeq ($(OS),Windows_NT)
    CLEAN_LIST := node_modules, apps/*/node_modules, packages/*/node_modules, apps/*/dist, packages/*/dist, .bun
    DELETE_CMD := powershell -ExecutionPolicy Bypass -Command "foreach ($$target in '$(CLEAN_LIST)'.Split(',').Trim()) { if (Test-Path $$target) { Remove-Item -Path $$target -Recurse -Force -ErrorAction SilentlyContinue } }"
else
    DELETE_CMD := rm -rf node_modules apps/*/node_modules packages/*/node_modules apps/*/dist packages/*/dist .bun
endif

clean:
	$(DELETE_CMD)

# ==============================================================================
# Database Management (Shared Package)
# ==============================================================================

DB_PKG_DIR := packages/shared

db-generate:
	cd $(DB_PKG_DIR) && bun run db:generate

db-migrate:
	cd $(DB_PKG_DIR) && bun run db:migrate

db-seed:
	cd $(DB_PKG_DIR) && bun run db:seed

db-studio:
	cd $(DB_PKG_DIR) && bun run db:studio
