import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { resolveEnvChain } from '../../src/env/envResolver.js';

describe('resolveEnvChain', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `flint-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads base.env when envName is "base"', () => {
    writeFileSync(join(tmpDir, 'base.env'), 'BASE_URL=https://base.example.com\nFOO=base');
    const result = resolveEnvChain(tmpDir, 'base');
    expect(result).toEqual({ BASE_URL: 'https://base.example.com', FOO: 'base' });
  });

  it('merges named env over base', () => {
    writeFileSync(join(tmpDir, 'base.env'), 'FOO=base\nBAR=base-bar');
    writeFileSync(join(tmpDir, 'staging.env'), 'FOO=staging');
    const result = resolveEnvChain(tmpDir, 'staging');
    expect(result).toEqual({ FOO: 'staging', BAR: 'base-bar' });
  });

  it('named env overrides base values', () => {
    writeFileSync(join(tmpDir, 'base.env'), 'URL=https://base.com');
    writeFileSync(join(tmpDir, 'prod.env'), 'URL=https://prod.com');
    const result = resolveEnvChain(tmpDir, 'prod');
    expect(result['URL']).toBe('https://prod.com');
  });

  it('returns empty map if neither base nor named env exists', () => {
    const result = resolveEnvChain(tmpDir, 'nonexistent');
    expect(result).toEqual({});
  });

  it('returns base only if named env does not exist', () => {
    writeFileSync(join(tmpDir, 'base.env'), 'FOO=base');
    const result = resolveEnvChain(tmpDir, 'staging');
    expect(result).toEqual({ FOO: 'base' });
  });
});
