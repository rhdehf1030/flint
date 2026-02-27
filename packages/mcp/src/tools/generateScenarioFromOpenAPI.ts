import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import yaml from 'js-yaml';
import { generateScenarioFromOpenAPI } from '@flint/core';

export function registerGenerateScenarioFromOpenAPI(server: McpServer): void {
  server.tool(
    'generate_scenario_from_openapi',
    'Generate a Flint scenario YAML from an OpenAPI 3.x spec string (JSON or YAML)',
    {
      spec: z.string().describe('OpenAPI 3.x spec as JSON or YAML string'),
    },
    (args) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(args.spec);
      } catch {
        parsed = yaml.load(args.spec);
      }

      const scenario = generateScenarioFromOpenAPI(parsed as Parameters<typeof generateScenarioFromOpenAPI>[0]);
      const scenarioYaml = yaml.dump(scenario);

      return {
        content: [{ type: 'text' as const, text: scenarioYaml }],
      };
    },
  );
}
