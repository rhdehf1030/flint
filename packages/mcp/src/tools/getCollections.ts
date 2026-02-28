import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildCollections } from '@flint/core';
import { getOperationInfo } from '../utils/collectionUtils.js';

export function registerGetCollections(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'get_collections',
    'List all available collection operations in the workspace, grouped by collection (folder)',
    {
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    async (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const collectionsDir = resolve(ws, 'collections');
      const collections = buildCollections(collectionsDir);

      const result = collections.map((col) => ({
        name: col.name,
        dirPath: col.dirPath,
        requests: col.requests.map((req) => {
          const op = getOperationInfo(req);
          return {
            operationId: op.operationId,
            method: op.method.toUpperCase(),
            path: op.path,
            summary: op.summary,
          };
        }),
      }));

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
