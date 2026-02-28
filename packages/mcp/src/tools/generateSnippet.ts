import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildCollectionIndex, resolveEnvChain, buildRequest, generateCodeSnippet } from '@flint/core';
import type { SnippetTarget } from '@flint/core';

export function registerGenerateSnippet(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'generate_snippet',
    'Generate a code snippet for a request in the specified language/tool',
    {
      operationId: z.string().describe('The operationId of the request'),
      target: z.enum(['curl', 'fetch', 'axios', 'python-requests', 'go-http', 'httpie']).describe('Target language/tool for the snippet'),
      env: z.string().optional().describe('Environment name for variable interpolation (default: base)'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const collectionsDir = resolve(ws, 'collections');
      const envDir = resolve(ws, 'environments');

      const index = buildCollectionIndex(collectionsDir);
      const collection = index.get(args.operationId);
      if (!collection) {
        const available = [...index.keys()].join(', ');
        return {
          content: [{ type: 'text' as const, text: `Operation not found: ${args.operationId}\nAvailable: ${available}` }],
        };
      }

      const envMap = resolveEnvChain(envDir, args.env ?? 'base');
      const request = buildRequest(collection, envMap);
      const snippet = generateCodeSnippet(request, args.target as SnippetTarget);

      return {
        content: [{ type: 'text' as const, text: snippet.code }],
      };
    },
  );
}
