import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '../dist/index.js');
const FIXTURES = join(__dirname, 'fixtures');

async function flint(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const result = await execa(process.execPath, [CLI_PATH, ...args], {
    reject: false,
    env: { ...process.env },
  });
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe('flint validate', () => {
  it('exits 0 for a valid collection file', async () => {
    const result = await flint([
      'validate',
      join(FIXTURES, 'collections/get-users.yaml'),
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('✓');
  }, 15000);

  it('exits 1 for an invalid collection file', async () => {
    const result = await flint([
      'validate',
      join(FIXTURES, 'invalid/missing-required.yaml'),
    ]);
    expect(result.exitCode).toBe(1);
  }, 15000);

  it('accepts a directory of valid collections', async () => {
    const result = await flint(['validate', join(FIXTURES, 'collections')]);
    expect(result.exitCode).toBe(0);
  }, 15000);
});
