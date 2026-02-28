import { resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import yaml from 'js-yaml';

export function registerCreateScenario(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'create_scenario',
    'Create a scenario YAML file from a list of operationIds',
    {
      name: z.string().describe('Scenario name (e.g. "User Flow")'),
      operationIds: z.array(z.string()).describe('Ordered list of operationIds to include as steps'),
      outputPath: z.string().optional().describe('Output file path (relative to workspaceRoot or absolute). Defaults to scenarios/{name}.yaml'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;

      const scenario = {
        'x-flint-scenario': {
          name: args.name,
          version: '1.0.0',
          steps: args.operationIds.map((id) => ({
            operationId: id,
            assertions: [{ status: 200 }],
          })),
        },
      };

      const defaultFileName = args.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.yaml';
      const outputPath = args.outputPath
        ? resolve(ws, args.outputPath)
        : resolve(ws, 'scenarios', defaultFileName);

      mkdirSync(resolve(outputPath, '..'), { recursive: true });
      writeFileSync(outputPath, yaml.dump(scenario), 'utf8');

      return {
        content: [{ type: 'text' as const, text: `Created scenario: ${outputPath}` }],
      };
    },
  );
}
