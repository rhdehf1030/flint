import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { resultStore } from '../lruStore.js';

export function registerAnalyzeFailure(server: McpServer): void {
  server.tool(
    'analyze_failure',
    'Analyze a failed scenario result and return structured failure context for debugging',
    {
      resultId: z.string().describe('UUID of the ScenarioResult to analyze'),
    },
    (args) => {
      const result = resultStore.get(args.resultId);
      if (!result) {
        return {
          content: [{ type: 'text' as const, text: `No result found with id: ${args.resultId}` }],
        };
      }

      if (result.passed) {
        return {
          content: [{ type: 'text' as const, text: 'Scenario passed — no failures to analyze.' }],
        };
      }

      const lines: string[] = [
        `# Failure Analysis: ${result.scenarioName}`,
        `Scenario: ${result.scenarioPath}`,
        `Environment: ${result.env}`,
        `Total duration: ${result.totalDurationMs}ms`,
        '',
      ];

      for (const step of result.steps) {
        if (step.passed) continue;

        lines.push(`## Failed Step [${step.stepIndex}]: ${step.operationId}`);
        lines.push(`Duration: ${step.durationMs}ms`);
        lines.push('');
        lines.push('### Request');
        lines.push(`${step.request.method} ${step.request.url}`);
        if (Object.keys(step.request.headers).length > 0) {
          lines.push('Headers: ' + JSON.stringify(step.request.headers));
        }
        lines.push('');
        lines.push('### Response');
        lines.push(`Status: ${step.response.status}`);
        lines.push(`Body: ${JSON.stringify(step.response.body, null, 2)}`);
        lines.push('');
        lines.push('### Failed Assertions');

        for (const assertion of step.assertions) {
          if (!assertion.passed) {
            lines.push(`  ✗ ${assertion.message}`);
            if (assertion.diff) {
              lines.push(`    Expected: ${JSON.stringify(assertion.diff.expected)}`);
              lines.push(`    Actual:   ${JSON.stringify(assertion.diff.actual)}`);
            }
          }
        }
        lines.push('');
      }

      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      };
    },
  );
}
