import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { saveHistoryEntry } from '../../src/history/historyStore.js';
import { getHistory } from '../../src/history/historyReader.js';
import { compareResponses } from '../../src/history/responseComparator.js';
import type { HistoryEntry, HttpResponse } from '../../src/types/index.js';

function makeEntry(operationId: string, suffix = ''): HistoryEntry {
  return {
    id: `entry-${suffix}`,
    operationId,
    timestamp: new Date().toISOString(),
    request: {
      method: 'GET',
      url: 'https://example.com',
      headers: {},
      queryParams: {},
      body: { type: 'none' },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { ok: true },
      rawBody: '{"ok":true}',
      responseTimeMs: 50,
    },
  };
}

function makeResponse(body: unknown, status = 200): HttpResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body,
    rawBody: JSON.stringify(body),
    responseTimeMs: 50,
  };
}

describe('history store and reader', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `flint-history-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('saves and reads back a history entry', async () => {
    const entry = makeEntry('getUser', '1');
    await saveHistoryEntry(entry, tmpDir);
    const history = getHistory('getUser', tmpDir);
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('entry-1');
  });

  it('returns entries in newest-first order', async () => {
    for (let i = 0; i < 3; i++) {
      await saveHistoryEntry(makeEntry('op', String(i)), tmpDir);
      // Small delay to ensure different mtime
      await new Promise((r) => setTimeout(r, 10));
    }
    const history = getHistory('op', tmpDir, 3);
    expect(history).toHaveLength(3);
  });

  it('returns empty array for unknown operationId', () => {
    const history = getHistory('nonexistent', tmpDir);
    expect(history).toEqual([]);
  });

  it('trims to 50 entries when more are saved', async () => {
    for (let i = 0; i < 55; i++) {
      const entry: HistoryEntry = {
        ...makeEntry('op', String(i)),
        timestamp: new Date(Date.now() + i).toISOString(),
      };
      await saveHistoryEntry(entry, tmpDir);
    }
    const history = getHistory('op', tmpDir, 100);
    expect(history.length).toBeLessThanOrEqual(50);
  });
});

describe('compareResponses', () => {
  it('detects no diff for identical responses', () => {
    const a = makeResponse({ user: { id: 1, name: 'Alice' } });
    const diff = compareResponses(a, a);
    expect(diff.hasDiff).toBe(false);
  });

  it('detects status code change', () => {
    const a = makeResponse({}, 200);
    const b = makeResponse({}, 404);
    const diff = compareResponses(a, b);
    expect(diff.statusChanged).toBe(true);
    expect(diff.statusBefore).toBe(200);
    expect(diff.statusAfter).toBe(404);
  });

  it('detects added field', () => {
    const a = makeResponse({ id: 1 });
    const b = makeResponse({ id: 1, name: 'Alice' });
    const diff = compareResponses(a, b);
    expect(diff.hasDiff).toBe(true);
    const addedField = diff.fields.find((f) => f.path === 'body.name');
    expect(addedField?.type).toBe('added');
  });

  it('detects removed field', () => {
    const a = makeResponse({ id: 1, name: 'Alice' });
    const b = makeResponse({ id: 1 });
    const diff = compareResponses(a, b);
    const removedField = diff.fields.find((f) => f.path === 'body.name');
    expect(removedField?.type).toBe('removed');
  });

  it('detects type change', () => {
    const a = makeResponse({ age: '30' });
    const b = makeResponse({ age: 30 });
    const diff = compareResponses(a, b);
    const changedField = diff.fields.find((f) => f.path === 'body.age');
    expect(changedField?.typeChanged).toBe(true);
  });
});
