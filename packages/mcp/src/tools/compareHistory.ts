import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getHistory, compareResponses } from '@flint/core';

export function registerCompareHistory(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'compare_history',
    'Compare the two most recent recorded responses for an operation to detect regressions',
    {
      operationId: z.string().describe('Operation ID to compare history for'),
      limit: z.number().optional().describe('Number of history entries to fetch (default: 2, min: 2)'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    async (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const historyDir = resolve(ws, '.flint', 'history');
      const limit = Math.max(2, args.limit ?? 2);

      const entries = await getHistory(args.operationId, historyDir, limit);

      if (entries.length < 2) {
        return {
          content: [{ type: 'text' as const, text: `Not enough history for ${args.operationId} (need ≥2, got ${entries.length})` }],
        };
      }

      const latest = entries[0]!;
      const previous = entries[1]!;
      const diff = compareResponses(previous.response, latest.response);

      const result = {
        operationId: args.operationId,
        previous: { timestamp: previous.timestamp, status: previous.response.status },
        latest: { timestamp: latest.timestamp, status: latest.response.status },
        diff,
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
