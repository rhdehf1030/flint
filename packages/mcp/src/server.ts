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
import { registerCreateWorkspace } from './tools/createWorkspace.js';

/**
 * Create and configure the Flint MCP server with all 12 tools registered.
 */
export function createFlintMcpServer(workspaceRef: { root: string }): McpServer {
  const server = new McpServer({
    name: 'flint',
    version: '0.0.0',
  });

  registerRunScenario(server, workspaceRef);
  registerGetCollections(server, workspaceRef);
  registerCreateRequest(server, workspaceRef);
  registerGetLastResult(server);
  registerGenerateScenarioFromOpenAPI(server);
  registerAnalyzeFailure(server);
  registerMockServerStart(server, workspaceRef);
  registerMockServerStop(server);
  registerRunBench(server, workspaceRef);
  registerGetHistory(server, workspaceRef);
  registerGenerateDocs(server, workspaceRef);
  registerCreateWorkspace(server);

  return server;
}
