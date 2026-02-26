import { mkdirSync, writeFileSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';

import type { HistoryEntry } from '../types/index.js';

const MAX_HISTORY = 50;

export async function saveHistoryEntry(entry: HistoryEntry, historyDir: string): Promise<void> {
  const operationDir = join(historyDir, entry.operationId);
  mkdirSync(operationDir, { recursive: true });

  const filename = `${entry.timestamp.replace(/[:.]/g, '-')}.json`;
  const filePath = join(operationDir, filename);
  writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8');

  // Trim to MAX_HISTORY
  trimHistory(operationDir);
}

function trimHistory(operationDir: string): void {
  let files: string[];
  try {
    files = readdirSync(operationDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({ name: f, mtime: statSync(join(operationDir, f)).mtimeMs }))
      .sort((a, b) => a.mtime - b.mtime)
      .map((f) => f.name);
  } catch {
    return;
  }

  while (files.length > MAX_HISTORY) {
    const oldest = files.shift()!;
    try {
      unlinkSync(join(operationDir, oldest));
    } catch {
      // ignore
    }
  }
}
