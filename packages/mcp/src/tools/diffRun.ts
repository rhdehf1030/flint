import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { parseScenarioFile, buildCollectionIndex, resolveEnvChain, runDiffScenario } from '@flint/core';

export function registerDiffRun(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'diff_run',
    'Run a scenario against two environments and compare the responses to detect differences',
    {
      scenarioPath: z.string().describe('Path to the scenario YAML file (absolute or relative to workspaceRoot)'),
      envA: z.string().describe('First environment name (e.g. "base")'),
      envB: z.string().describe('Second environment name (e.g. "staging")'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    async (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const absPath = resolve(ws, args.scenarioPath);
      const envDir = resolve(ws, 'environments');
      const collectionsDir = resolve(ws, 'collections');

      const scenario = parseScenarioFile(absPath);
      const index = buildCollectionIndex(collectionsDir);
      const mapA = resolveEnvChain(envDir, args.envA);
      const mapB = resolveEnvChain(envDir, args.envB);

      const result = await runDiffScenario(scenario, index, mapA, mapB);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
