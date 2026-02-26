import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { EnvMap } from '../types/index.js';

import { loadEnvFile } from './envLoader.js';

/**
 * Resolve environment chain: load base.env then merge named env on top.
 * Named env values override base values.
 */
export function resolveEnvChain(envDir: string, envName: string): EnvMap {
  const basePath = join(envDir, 'base.env');
  const namedPath = join(envDir, `${envName}.env`);

  let base: EnvMap = {};
  if (existsSync(basePath)) {
    base = loadEnvFile(basePath);
  }

  if (envName === 'base') {
    return base;
  }

  let named: EnvMap = {};
  if (existsSync(namedPath)) {
    named = loadEnvFile(namedPath);
  }

  return { ...base, ...named };
}
