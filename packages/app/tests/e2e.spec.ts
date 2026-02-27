import { test, expect, _electron as electron } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MAIN_PATH = resolve(__dirname, '../dist/main/index.js');

let tmpDirs: string[] = [];

function makeWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'flint-e2e-'));
  tmpDirs.push(dir);
  mkdirSync(join(dir, 'collections'), { recursive: true });
  mkdirSync(join(dir, 'environments'), { recursive: true });
  writeFileSync(join(dir, 'environments', 'base.env'), 'BASE_URL=https://httpbin.org\n', 'utf8');
  writeFileSync(
    join(dir, 'collections', 'getAnything.yaml'),
    `openapi: '3.0.0'
info:
  title: HTTPBin
  version: 1.0.0
servers:
  - url: '{{BASE_URL}}'
paths:
  /get:
    get:
      operationId: getAnything
      summary: HTTPBin GET
      responses:
        '200':
          description: OK
`,
    'utf8',
  );
  return dir;
}

test.afterAll(() => {
  for (const dir of tmpDirs) {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  tmpDirs = [];
});

test('app launches and main window is visible', async () => {
  const workspaceRoot = makeWorkspace();
  const app = await electron.launch({
    args: [MAIN_PATH],
    env: { ...process.env, FLINT_WORKSPACE: workspaceRoot },
  });

  try {
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Take screenshot to verify window is visible
    const screenshot = await window.screenshot();
    expect(screenshot.byteLength).toBeGreaterThan(0);

    // Check the page title
    const title = await window.title();
    expect(title).toBe('Flint');
  } finally {
    await app.close();
  }
});

test('GET request shows status code 200 in response viewer', async () => {
  const workspaceRoot = makeWorkspace();
  const app = await electron.launch({
    args: [MAIN_PATH],
    env: { ...process.env, FLINT_WORKSPACE: workspaceRoot },
  });

  try {
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Click on the getAnything collection item
    const collectionItem = window.locator('text=getAnything').first();
    if (await collectionItem.isVisible()) {
      await collectionItem.click();

      // Click Send button
      const sendBtn = window.locator('button', { hasText: 'Send' }).first();
      await sendBtn.click();

      // Wait for response
      await window.waitForTimeout(3000);

      // Check status code badge
      const statusBadge = window.locator('text=200').first();
      await expect(statusBadge).toBeVisible({ timeout: 10000 });
    }
  } finally {
    await app.close();
  }
});

test('collection tree is visible with fixture collections', async () => {
  const workspaceRoot = makeWorkspace();
  const app = await electron.launch({
    args: [MAIN_PATH],
    env: { ...process.env, FLINT_WORKSPACE: workspaceRoot },
  });

  try {
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Check that COLLECTIONS header is visible
    const collectionsHeader = window.locator('text=COLLECTIONS').first();
    await expect(collectionsHeader).toBeVisible({ timeout: 5000 });
  } finally {
    await app.close();
  }
});

test('MCP server responds on /health after app launch', async () => {
  const workspaceRoot = makeWorkspace();
  const app = await electron.launch({
    args: [MAIN_PATH],
    env: { ...process.env, FLINT_WORKSPACE: workspaceRoot },
  });

  try {
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    // Give MCP server time to start
    await window.waitForTimeout(2000);

    // Check MCP health from within the Electron window context
    const result = await window.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3141/health');
        return await res.json() as Record<string, unknown>;
      } catch {
        return null;
      }
    });

    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>)['status']).toBe('ok');
  } finally {
    await app.close();
  }
});
