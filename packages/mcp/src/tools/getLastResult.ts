import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { resultStore } from '../lruStore.js';

export function registerGetLastResult(server: McpServer): void {
  server.tool(
    'get_last_result',
    'Get the most recently executed scenario result',
    () => {
      const result = resultStore.getLast();
      return {
        content: [{ type: 'text' as const, text: result ? JSON.stringify(result, null, 2) : 'null' }],
      };
    },
  );
}
