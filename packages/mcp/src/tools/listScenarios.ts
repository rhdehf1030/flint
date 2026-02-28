import { resolve } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerListScenarios(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'list_scenarios',
    'List all scenario YAML files in the workspace scenarios/ directory',
    {
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const scenariosDir = resolve(ws, 'scenarios');

      if (!existsSync(scenariosDir)) {
        return {
          content: [{ type: 'text' as const, text: 'No scenarios/ directory found.' }],
        };
      }

      const files = readdirSync(scenariosDir)
        .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
        .map((f) => resolve(scenariosDir, f));

      if (files.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No scenario files found.' }],
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(files, null, 2) }],
      };
    },
  );
}
