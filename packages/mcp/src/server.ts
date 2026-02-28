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
import { registerRunRequest } from './tools/runRequest.js';
import { registerImportOpenapi } from './tools/importOpenapi.js';
import { registerImportPostman } from './tools/importPostman.js';
import { registerListScenarios } from './tools/listScenarios.js';
import { registerListEnvironments } from './tools/listEnvironments.js';
import { registerCreateScenario } from './tools/createScenario.js';
import { registerDiffRun } from './tools/diffRun.js';
import { registerGenerateSnippet } from './tools/generateSnippet.js';
import { registerValidateRequest } from './tools/validateRequest.js';
import { registerExportOpenapi } from './tools/exportOpenapi.js';
import { registerCompareHistory } from './tools/compareHistory.js';
import { registerGetWorkspace } from './tools/getWorkspace.js';

/**
 * Create and configure the Flint MCP server with all 23 tools registered.
 */
export function createFlintMcpServer(workspaceRef: { root: string }): McpServer {
  const server = new McpServer({
    name: 'flint',
    version: '0.0.0',
  });

  // Core execution
  registerRunScenario(server, workspaceRef);
  registerRunRequest(server, workspaceRef);
  registerRunBench(server, workspaceRef);
  registerDiffRun(server, workspaceRef);

  // Collections & workspace
  registerGetWorkspace(server, workspaceRef);
  registerGetCollections(server, workspaceRef);
  registerCreateRequest(server, workspaceRef);
  registerCreateWorkspace(server);
  registerImportOpenapi(server, workspaceRef);
  registerImportPostman(server, workspaceRef);
  registerExportOpenapi(server, workspaceRef);
  registerValidateRequest(server, workspaceRef);

  // Scenarios
  registerListScenarios(server, workspaceRef);
  registerCreateScenario(server, workspaceRef);
  registerGenerateScenarioFromOpenAPI(server);

  // Environments
  registerListEnvironments(server, workspaceRef);

  // Mock server
  registerMockServerStart(server, workspaceRef);
  registerMockServerStop(server);

  // History & results
  registerGetHistory(server, workspaceRef);
  registerGetLastResult(server);
  registerAnalyzeFailure(server);
  registerCompareHistory(server, workspaceRef);

  // Docs & snippets
  registerGenerateDocs(server, workspaceRef);
  registerGenerateSnippet(server, workspaceRef);

  return server;
}
