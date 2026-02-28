import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  parseScenarioFile,
  buildCollectionIndex,
  resolveEnvChain,
  runScenario,
} from '@flint/core';

import { resultStore } from '../lruStore.js';

export function registerRunScenario(server: McpServer, workspaceRoot: string): void {
  server.tool(
    'run_scenario',
    'Run a Flint scenario and return the result as JSON',
    {
      scenarioPath: z.string().describe('Path to the scenario YAML file (absolute or relative to workspaceRoot)'),
      env: z.string().optional().describe('Environment name (default: base)'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    async (args) => {
      const ws = args.workspaceRoot ?? workspaceRoot;
      const absPath = resolve(ws, args.scenarioPath);
      const envName = args.env ?? 'base';
      const envDir = resolve(ws, 'environments');
      const collectionsDir = resolve(ws, 'collections');

      const scenario = parseScenarioFile(absPath);
      const index = buildCollectionIndex(collectionsDir);
      const env = resolveEnvChain(envDir, envName);
      const result = await runScenario(scenario, index, env);

      resultStore.set(result.id, result);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
