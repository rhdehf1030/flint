import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getHistory } from '@flint/core';

export function registerGetHistory(server: McpServer, workspaceRoot: string): void {
  server.tool(
    'get_history',
    'Get execution history for a specific operationId',
    {
      operationId: z.string().describe('Operation ID to get history for'),
      limit: z.number().optional().describe('Maximum number of entries to return (default: 10)'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    async (args) => {
      const ws = args.workspaceRoot ?? workspaceRoot;
      const historyDir = resolve(ws, '.flint', 'history');
      const entries = await getHistory(args.operationId, historyDir, args.limit ?? 10);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(entries, null, 2) }],
      };
    },
  );
}
