import { createServer, type Server } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '../dist/index.js');
const FIXTURES = join(__dirname, 'fixtures');
const PORT = 29877;

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

describe('flint run', () => {
  it('exits 0 when all assertions pass', async () => {
    const result = await flint([
      'run',
      join(FIXTURES, 'scenarios/basic.yaml'),
      '--collections', join(FIXTURES, 'collections'),
    ]);
    expect(result.exitCode).toBe(0);
  }, 15000);

  it('exits 1 when assertions fail', async () => {
    const result = await flint([
      'run',
      join(FIXTURES, 'scenarios/failing.yaml'),
      '--collections', join(FIXTURES, 'collections'),
    ]);
    expect(result.exitCode).toBe(1);
  }, 15000);

  it('reports result in pretty format by default', async () => {
    const result = await flint([
      'run',
      join(FIXTURES, 'scenarios/basic.yaml'),
      '--collections', join(FIXTURES, 'collections'),
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  }, 15000);
});
