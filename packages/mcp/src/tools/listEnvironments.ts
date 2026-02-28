import { resolve } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerListEnvironments(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'list_environments',
    'List all available environment names in the workspace environments/ directory',
    {
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const envDir = resolve(ws, 'environments');

      if (!existsSync(envDir)) {
        return {
          content: [{ type: 'text' as const, text: 'No environments/ directory found.' }],
        };
      }

      const envs = readdirSync(envDir)
        .filter((f) => f.endsWith('.env'))
        .map((f) => f.replace(/\.env$/, ''));

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(envs, null, 2) }],
      };
    },
  );
}
