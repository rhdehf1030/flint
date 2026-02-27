import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerRunScenario } from './tools/runScenario.js';
import { registerGetCollections } from './tools/getCollections.js';
import { registerCreateRequest } from './tools/createRequest.js';
import { registerGetLastResult } from './tools/getLastResult.js';
import { registerGenerateScenarioFromOpenAPI } from './tools/generateScenarioFromOpenAPI.js';
import { registerAnalyzeFailure } from './tools/analyzeFailure.js';
import { registerMockServerStart } from './tools/mockServerStart.js';
import { registerMockServerStop } from './tools/mockServerStop.js';
import { registerRunBench } from './tools/runBench.js';
import { registerGetHistory } from './tools/getHistory.js';
import { registerGenerateDocs } from './tools/generateDocs.js';

/**
 * Create and configure the Flint MCP server with all 11 tools registered.
 */
export function createFlintMcpServer(workspaceRoot: string): McpServer {
  const server = new McpServer({
    name: 'flint',
    version: '0.0.0',
  });

  registerRunScenario(server, workspaceRoot);
  registerGetCollections(server, workspaceRoot);
  registerCreateRequest(server, workspaceRoot);
  registerGetLastResult(server);
  registerGenerateScenarioFromOpenAPI(server);
  registerAnalyzeFailure(server);
  registerMockServerStart(server, workspaceRoot);
  registerMockServerStop(server);
  registerRunBench(server, workspaceRoot);
  registerGetHistory(server, workspaceRoot);
  registerGenerateDocs(server, workspaceRoot);

  return server;
}
