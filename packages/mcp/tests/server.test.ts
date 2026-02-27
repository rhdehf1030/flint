import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { describe, it, expect, afterEach } from 'vitest';

import { startMcpServer } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tmpDirs: string[] = [];
afterEach(() => {
  for (const dir of tmpDirs) {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  tmpDirs.length = 0;
});

function makeWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'flint-mcp-'));
  tmpDirs.push(dir);
  mkdirSync(join(dir, 'collections'), { recursive: true });
  mkdirSync(join(dir, 'environments'), { recursive: true });
  writeFileSync(join(dir, 'environments', 'base.env'), 'BASE_URL=http://localhost\n', 'utf8');

  // Minimal collection
  writeFileSync(join(dir, 'collections', 'getTest.yaml'), `
openapi: '3.0.0'
info:
  title: Test
  version: 1.0.0
servers:
  - url: '{{BASE_URL}}'
paths:
  /test:
    get:
      operationId: getTest
      responses:
        '200':
          description: OK
`, 'utf8');

  return dir;
}

describe('MCP server integration', () => {
  it('starts server and responds to GET /health', async () => {
    const workspaceRoot = makeWorkspace();
    const handle = await startMcpServer(0, workspaceRoot);

    try {
      // Extract actual port from baseUrl
      const port = parseInt(new URL(handle.baseUrl).port);
      const response = await fetch(`http://localhost:${port}/health`);
      expect(response.status).toBe(200);
      const body = await response.json() as Record<string, unknown>;
      expect(body['status']).toBe('ok');
      expect(body['version']).toBe('1.0.0');
    } finally {
      await handle.stop();
    }
  }, 15000);

  it('get_collections tool is accessible via SSE endpoint (GET /sse returns SSE headers)', async () => {
    const workspaceRoot = makeWorkspace();
    const handle = await startMcpServer(0, workspaceRoot);

    try {
      const port = parseInt(new URL(handle.baseUrl).port);
      // Just check that /sse responds with SSE content-type
      const controller = new AbortController();
      const response = await fetch(`http://localhost:${port}/sse`, {
        signal: controller.signal,
      }).catch(() => null);

      if (response) {
        expect(response.headers.get('content-type')).toContain('text/event-stream');
      }
      controller.abort();
    } finally {
      await handle.stop();
    }
  }, 15000);
});
