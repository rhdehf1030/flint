import { readFileSync } from 'node:fs';

import type { EnvMap } from '../types/index.js';

export class EnvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvParseError';
  }
}

/**
 * Parse .env file content into EnvMap.
 * Supports:
 *   - KEY=VALUE
 *   - KEY="quoted value"
 *   - KEY='single quoted'
 *   - # comments
 *   - Multiline values with backslash continuation
 */
export function parseEnvContent(content: string): EnvMap {
  const result: EnvMap = {};
  const lines = content.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];
    i++;

    // Skip empty lines and comments
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    // Handle backslash line continuation
    while (line.endsWith('\\') && i < lines.length) {
      line = line.slice(0, -1) + lines[i];
      i++;
    }

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    if (!key) continue;

    let value = line.slice(eqIdx + 1);

    // Handle quoted values
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
      // Unescape \n, \t in double-quoted values
      if (line.slice(eqIdx + 1).startsWith('"')) {
        value = value.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
      }
    }

    result[key] = value;
  }

  return result;
}

/**
 * Load and parse a .env file from disk.
 */
export function loadEnvFile(path: string): EnvMap {
  let content: string;
  try {
    content = readFileSync(path, 'utf-8');
  } catch (err) {
    throw new EnvParseError(`Failed to read env file: ${path} — ${(err as Error).message}`);
  }
  return parseEnvContent(content);
}
