import { createServer } from 'node:http';

import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { createFlintMcpServer } from './server.js';

export interface McpServerHandle {
  stop(): Promise<void>;
  baseUrl: string;
}

/**
 * Start the Flint MCP server on the specified port.
 * Provides SSE transport (GET /sse, POST /message) and health check (GET /health).
 */
export async function startMcpServer(port: number, workspaceRoot: string): Promise<McpServerHandle> {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  // SSE transport: one transport per connection
  const transports = new Map<string, SSEServerTransport>();

  app.get('/sse', async (req, res) => {
    const transport = new SSEServerTransport('/message', res);

    transports.set(transport.sessionId, transport);

    res.on('close', () => {
      transports.delete(transport.sessionId);
    });

    const mcpServer = createFlintMcpServer(workspaceRoot);
    await mcpServer.connect(transport);
  });

  app.post('/message', async (req, res) => {
    const sessionId = req.query['sessionId'] as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: `No active session: ${sessionId}` });
      return;
    }

    await transport.handlePostMessage(req, res, req.body as unknown);
  });

  const httpServer = createServer(app);

  await new Promise<void>((resolve) => httpServer.listen(port, resolve));

  const assignedPort = (httpServer.address() as { port: number }).port;
  const baseUrl = `http://localhost:${assignedPort}`;

  return {
    baseUrl,
    async stop() {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
