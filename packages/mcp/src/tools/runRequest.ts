import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildCollectionIndex, resolveEnvChain, buildRequest, executeRequest } from '@flint/core';

export function registerRunRequest(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'run_request',
    'Execute a single request by operationId and return the response',
    {
      operationId: z.string().describe('The operationId of the request to execute'),
      env: z.string().optional().describe('Environment name (default: base)'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    async (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const collectionsDir = resolve(ws, 'collections');
      const envDir = resolve(ws, 'environments');
      const envName = args.env ?? 'base';

      const index = buildCollectionIndex(collectionsDir);
      const collection = index.get(args.operationId);
      if (!collection) {
        const available = [...index.keys()].join(', ');
        return {
          content: [{ type: 'text' as const, text: `Operation not found: ${args.operationId}\nAvailable: ${available}` }],
        };
      }

      const envMap = resolveEnvChain(envDir, envName);
      const request = buildRequest(collection, envMap);
      const response = await executeRequest(request);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ request, response }, null, 2) }],
      };
    },
  );
}
