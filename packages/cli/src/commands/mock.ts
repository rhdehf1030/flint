import { resolve } from 'node:path';
import { createServer } from 'node:http';

import type { Command } from 'commander';
import { buildCollectionIndex, createMockServer } from '@flint/core';

export function registerMockCommand(program: Command): void {
  program
    .command('mock')
    .description('Start a mock HTTP server based on collection definitions')
    .option('-p, --port <n>', 'port to listen on', '4000')
    .option('-c, --collections <dir>', 'collections directory', './collections')
    .action((opts: { port: string; collections: string }) => {
      const collectionsDir = resolve(opts.collections);
      const port = parseInt(opts.port, 10);

      const index = buildCollectionIndex(collectionsDir);
      const collections = [...index.values()];

      if (collections.length === 0) {
        console.error('No collection files found. Nothing to mock.');
        process.exit(1);
      }

      const mockServer = createMockServer(collections);

      const server = createServer((req, res) => {
        const method = (req.method ?? 'GET').toUpperCase();
        const url = req.url ?? '/';
        const path = url.split('?')[0];

        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === 'string') headers[k] = v;
          else if (Array.isArray(v)) headers[k] = v.join(', ');
        }

          void mockServer.handle(method, path, headers).then((mockResult) => {
          res.writeHead(mockResult.status, mockResult.headers);

          const body = mockResult.body;
          if (body === undefined || body === null) {
            res.end();
          } else if (typeof body === 'string') {
            res.end(body);
          } else {
            res.end(JSON.stringify(body));
          }
        }).catch((err: Error) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
      });

      server.listen(port, () => {
        console.log(`\x1b[36m[mock]\x1b[0m Server listening on http://localhost:${port}`);
        console.log(`\x1b[36m[mock]\x1b[0m ${collections.length} operation(s) available`);
        console.log('Press Ctrl+C to stop.');
      });

      process.on('SIGINT', () => {
        server.close(() => {
          console.log('\n[mock] Server stopped.');
          process.exit(0);
        });
      });
    });
}
