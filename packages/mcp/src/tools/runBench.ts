import { resolve } from 'node:path';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  parseScenarioFile,
  buildCollectionIndex,
  resolveEnvChain,
  runBenchmark,
} from '@flint/core';

export function registerRunBench(server: McpServer, workspaceRoot: string): void {
  server.tool(
    'run_bench',
    'Run a benchmark against a scenario and return performance metrics',
    {
      scenarioPath: z.string().describe('Path to the scenario YAML file'),
      env: z.string().optional().describe('Environment name (default: base)'),
      concurrent: z.number().optional().describe('Number of concurrent requests (default: 10)'),
      duration: z.number().optional().describe('Benchmark duration in seconds (default: 10)'),
      maxRequests: z.number().optional().describe('Maximum number of requests'),
      rampUpSeconds: z.number().optional().describe('Ramp-up time in seconds'),
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

      const options = {
        concurrent: args.concurrent ?? 10,
        ...(args.duration !== undefined ? { duration: args.duration } : { duration: 10 }),
        ...(args.maxRequests !== undefined ? { maxRequests: args.maxRequests } : {}),
        ...(args.rampUpSeconds !== undefined ? { rampUpSeconds: args.rampUpSeconds } : {}),
      };

      const result = await runBenchmark(scenario, index, env, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
