import { readFileSync } from 'node:fs';

import yaml from 'js-yaml';

import type { AuthProfile } from '../types/index.js';

export class AuthProfileParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthProfileParseError';
  }
}

export function parseAuthProfile(filePath: string): AuthProfile {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new AuthProfileParseError(
      `Failed to read auth profile: ${filePath} — ${(err as Error).message}`,
    );
  }

  let doc: unknown;
  try {
    doc = yaml.load(content);
  } catch (err) {
    throw new AuthProfileParseError(`Invalid YAML in ${filePath}: ${(err as Error).message}`);
  }

  if (typeof doc !== 'object' || doc === null) {
    throw new AuthProfileParseError(`${filePath}: not a valid auth profile`);
  }

  const profile = doc as Record<string, unknown>;
  if (!profile['name'] || !profile['type']) {
    throw new AuthProfileParseError(`${filePath}: missing name or type field`);
  }

  return doc as AuthProfile;
}
