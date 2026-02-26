import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import type { HistoryEntry } from '../types/index.js';

export function getHistory(
  operationId: string,
  historyDir: string,
  limit = 50,
): HistoryEntry[] {
  const operationDir = join(historyDir, operationId);

  let files: string[];
  try {
    files = readdirSync(operationDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({ name: f, mtime: statSync(join(operationDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime) // newest first
      .slice(0, limit)
      .map((f) => f.name);
  } catch {
    return [];
  }

  const entries: HistoryEntry[] = [];
  for (const file of files) {
    try {
      const content = readFileSync(join(operationDir, file), 'utf-8');
      entries.push(JSON.parse(content) as HistoryEntry);
    } catch {
      // skip corrupted files
    }
  }
  return entries;
}
