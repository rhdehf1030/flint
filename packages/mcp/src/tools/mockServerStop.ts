import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getActiveMockServer, clearActiveMockServer } from './mockServerStart.js';

export function registerMockServerStop(server: McpServer): void {
  server.tool(
    'mock_server_stop',
    'Stop the running mock HTTP server',
    async () => {
      const httpServer = getActiveMockServer();
      if (!httpServer) {
        return {
          content: [{ type: 'text' as const, text: 'No mock server is currently running.' }],
        };
      }

      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      clearActiveMockServer();

      return {
        content: [{ type: 'text' as const, text: 'Mock server stopped.' }],
      };
    },
  );
}
