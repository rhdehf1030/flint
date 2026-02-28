import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerGetWorkspace(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'get_workspace',
    'Get the current active workspace root directory',
    {},
    () => {
      return {
        content: [{ type: 'text' as const, text: workspaceRef.root }],
      };
    },
  );
}
