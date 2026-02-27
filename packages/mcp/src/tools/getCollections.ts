import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildCollectionIndex } from '@flint/core';

export function registerGetCollections(server: McpServer, workspaceRoot: string): void {
  server.tool(
    'get_collections',
    'List all available collection operations in the workspace',
    async () => {
      const collectionsDir = resolve(workspaceRoot, 'collections');
      const index = buildCollectionIndex(collectionsDir);

      const operations = [];
      for (const [operationId, collection] of index.entries()) {
        for (const [path, methods] of Object.entries(collection.paths)) {
          for (const [method, op] of Object.entries(methods)) {
            const operation = op as Record<string, unknown>;
            if (operation['operationId'] === operationId) {
              operations.push({
                operationId,
                path,
                method: method.toUpperCase(),
                title: (collection.info as Record<string, unknown>)?.['title'] as string ?? operationId,
                summary: operation['summary'] as string | undefined,
              });
            }
          }
        }
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(operations, null, 2) }],
      };
    },
  );
}
