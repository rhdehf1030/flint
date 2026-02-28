import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildCollections } from '@flint/core';
import { getOperationInfo } from '../utils/collectionUtils.js';

export function registerGetCollections(server: McpServer, workspaceRoot: string): void {
  server.tool(
    'get_collections',
    'List all available collection operations in the workspace, grouped by collection (folder)',
    async () => {
      const collectionsDir = resolve(workspaceRoot, 'collections');
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
