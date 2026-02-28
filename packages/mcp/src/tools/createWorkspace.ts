import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const DEFAULT_ENV_CONTENT = `# Flint environment variables
BASE_URL=http://localhost:3000
`;

export function registerCreateWorkspace(server: McpServer): void {
  server.tool(
    'create_workspace',
    'Create a new Flint workspace directory with standard folder structure (collections/, environments/, scenarios/)',
    {
      path: z.string().describe('Absolute path where the workspace should be created'),
      baseUrl: z.string().optional().describe('Base URL for the default environment (default: http://localhost:3000)'),
    },
    (args) => {
      const wsPath = resolve(args.path);

      mkdirSync(resolve(wsPath, 'collections'), { recursive: true });
      mkdirSync(resolve(wsPath, 'environments'), { recursive: true });
      mkdirSync(resolve(wsPath, 'scenarios'), { recursive: true });

      const baseUrl = args.baseUrl ?? 'http://localhost:3000';
      const envContent = `# Flint environment variables\nBASE_URL=${baseUrl}\n`;
      writeFileSync(resolve(wsPath, 'environments', 'base.env'), envContent, 'utf8');

      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `Workspace created at: ${wsPath}`,
              '  collections/   — place collection folders here',
              '  environments/  — base.env created',
              '  scenarios/     — place scenario YAML files here',
            ].join('\n'),
          },
        ],
      };
    },
  );
}
