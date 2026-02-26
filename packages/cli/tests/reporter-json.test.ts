import { createServer, type Server } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '../dist/index.js');
const FIXTURES = join(__dirname, 'fixtures');
const PORT = 29878;

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

let server: Server;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/users') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{ id: 1, name: 'Alice' }]));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function mkEnvDir(port: number): { dir: string; scenarioPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'flint-json-'));
  mkdirSync(join(dir, 'scenarios'), { recursive: true });
  mkdirSync(join(dir, 'environments'), { recursive: true });
  writeFileSync(join(dir, 'environments', 'base.env'), `BASE_URL=http://localhost:${port}\n`);
  return { dir, scenarioPath: join(dir, 'scenarios') };
}

describe('reporter-json', () => {
  it('outputs valid JSON with --reporter json', async () => {
    const { dir, scenarioPath } = mkEnvDir(PORT);
    try {
      writeFileSync(
        join(scenarioPath, 'basic.yaml'),
        readFileSync(join(FIXTURES, 'scenarios/basic.yaml')),
      );

      const result = await flint([
        'run',
        join(scenarioPath, 'basic.yaml'),
        '--collections', join(FIXTURES, 'collections'),
        '--reporter', 'json',
      ]);

      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('passed');
      expect(parsed).toHaveProperty('steps');
      expect(parsed['passed']).toBe(true);
      expect(Array.isArray(parsed['steps'])).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 15000);

  it('JSON output has passed=false when assertions fail', async () => {
    const { dir, scenarioPath } = mkEnvDir(PORT);
    try {
      writeFileSync(
        join(scenarioPath, 'failing.yaml'),
        readFileSync(join(FIXTURES, 'scenarios/failing.yaml')),
      );

      const result = await flint([
        'run',
        join(scenarioPath, 'failing.yaml'),
        '--collections', join(FIXTURES, 'collections'),
        '--reporter', 'json',
      ]);

      expect(result.exitCode).toBe(1);
      const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
      expect(parsed['passed']).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 15000);
});
