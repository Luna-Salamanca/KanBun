import { afterAll, beforeAll } from 'bun:test';
import type { Subprocess } from 'bun';
import { join } from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const API_URL = BASE_URL;
export const WS_URL = BASE_URL.replace('http', 'ws') + '/ws';

const SERVER_STARTUP_TIMEOUT = 10000;
const HEALTH_CHECK_INTERVAL = 200;

let serverProcess: Subprocess | null = null;

async function waitForServer(timeoutMs: number): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const resp = await fetch(`${API_URL}/health`);
      if (resp.ok) return;
    } catch {
      // keep waiting
    }
    await Bun.sleep(HEALTH_CHECK_INTERVAL);
  }
  throw new Error(`Server failed to start within ${timeoutMs}ms`);
}

async function waitForPortFree(timeoutMs: number): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      await fetch(`${API_URL}/health`);
      await Bun.sleep(HEALTH_CHECK_INTERVAL);
    } catch {
      return;
    }
  }
  // Double check one last time or just throw
  try {
    const resp = await fetch(`${API_URL}/health`);
    if (resp.ok) {
      throw new Error(`Port ${API_URL} is still occupied after ${timeoutMs}ms (waitForPortFree)`);
    }
  } catch {
    // Port is free
    return;
  }
}

export function setupTestServer() {
  beforeAll(async () => {
    // If a server is already running (from a previous test that didn't clean up), kill it or wait
    await waitForPortFree(5000);

    console.log('--- [TEST SETUP] Starting Server ---');
    const projectRoot = process.cwd().endsWith('e2e') ? join(process.cwd(), '..') : process.cwd();
    const serverCwd = join(projectRoot, 'apps', 'server');

    serverProcess = Bun.spawn(['bun', 'run', 'src/index.ts'], {
      cwd: serverCwd,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: '../../packages/shared/kanban.db',
      },
    });

    try {
      await waitForServer(SERVER_STARTUP_TIMEOUT);
      console.log('--- [TEST SETUP] Server Ready ---');
    } catch (err) {
      if (serverProcess) serverProcess.kill();
      throw err;
    }
  }, SERVER_STARTUP_TIMEOUT + 6000);

  afterAll(() => {
    if (serverProcess) {
      console.log('--- [TEST SETUP] Stopping Server ---');
      serverProcess.kill();
      serverProcess = null;
    }
  });
}
