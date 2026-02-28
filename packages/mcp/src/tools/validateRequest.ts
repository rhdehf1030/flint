import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { validateCollectionFile } from '@flint/core';

export function registerValidateRequest(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'validate_request',
    'Validate a collection request YAML file against the OpenAPI 3.x schema',
    {
      filePath: z.string().describe('Path to the collection YAML file (absolute or relative to workspaceRoot)'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    async (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const absPath = resolve(ws, args.filePath);
      const result = await validateCollectionFile(absPath);

      const text = result.valid
        ? `✓ Valid: ${absPath}`
        : `✗ Invalid: ${absPath}\n${result.errors.map((e) => `  - ${e.path ? `[${e.path}] ` : ''}${e.message}`).join('\n')}`;

      return {
        content: [{ type: 'text' as const, text }],
      };
    },
  );
}
