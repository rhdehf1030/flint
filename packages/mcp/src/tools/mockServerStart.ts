import { resolve } from 'node:path';
import { createServer, type Server } from 'node:http';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildCollectionIndex, createMockServer } from '@flint/core';

// Module-level mock server handle (singleton per MCP process)
let activeHttpServer: Server | null = null;
let activeMockBaseUrl = '';

export function registerMockServerStart(server: McpServer, workspaceRoot: string): void {
  server.tool(
    'mock_server_start',
    'Start a mock HTTP server based on collection definitions',
    {
      port: z.number().optional().describe('Port to listen on (default: 4000)'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    async (args) => {
      if (activeHttpServer) {
        return {
          content: [{ type: 'text' as const, text: `Mock server already running at ${activeMockBaseUrl}` }],
        };
      }

      const port = args.port ?? 4000;
      const ws = args.workspaceRoot ?? workspaceRoot;
      const collectionsDir = resolve(ws, 'collections');
      const index = buildCollectionIndex(collectionsDir);
      const collections = [...index.values()];

      if (collections.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No collections found. Cannot start mock server.' }],
        };
      }

      const mockServer = createMockServer(collections);

      const httpServer = createServer((req, res) => {
        const method = (req.method ?? 'GET').toUpperCase();
        const url = req.url ?? '/';
        const path = url.split('?')[0];

        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === 'string') headers[k] = v;
          else if (Array.isArray(v)) headers[k] = v.join(', ');
        }

        void mockServer.handle(method, path, headers).then((result) => {
          res.writeHead(result.status, result.headers);
          const body = result.body;
          if (body === undefined || body === null) res.end();
          else if (typeof body === 'string') res.end(body);
          else res.end(JSON.stringify(body));
        }).catch((err: Error) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
      });

      await new Promise<void>((resolve) => httpServer.listen(port, resolve));
      activeHttpServer = httpServer;
      activeMockBaseUrl = `http://localhost:${port}`;

      return {
        content: [{ type: 'text' as const, text: `Mock server started at ${activeMockBaseUrl} (${collections.length} operations)` }],
      };
    },
  );
}

export function getActiveMockServer(): Server | null {
  return activeHttpServer;
}

export function clearActiveMockServer(): void {
  activeHttpServer = null;
  activeMockBaseUrl = '';
}
