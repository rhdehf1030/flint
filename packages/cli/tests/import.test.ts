import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { describe, it, expect, afterEach } from 'vitest';
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

const tmpDirs: string[] = [];

afterEach(() => {
  for (const dir of tmpDirs) {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  tmpDirs.length = 0;
});

describe('flint import', () => {
  it('imports OpenAPI 3.x file and creates collection YAML files', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'flint-import-'));
    tmpDirs.push(outDir);

    const result = await flint([
      'import',
      join(FIXTURES, 'openapi/sample.yaml'),
      '--output', outDir,
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Detected: OpenAPI 3.x');

    const files = readdirSync(outDir);
    expect(files.length).toBe(2);
  }, 15000);

  it('reports error for unknown file format', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'flint-import-'));
    tmpDirs.push(outDir);

    const badFile = join(outDir, 'unknown.yaml');
    writeFileSync(badFile, 'somekey: somevalue\n', 'utf8');

    const result = await flint(['import', badFile, '--output', outDir]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Cannot detect file format');
  }, 15000);
});
