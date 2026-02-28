import { ipcMain } from 'electron';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import type { Server } from 'node:http';

import {
  runScenario,
  buildCollectionIndex,
  buildCollections,
  parseCollectionFile,
  parseScenarioFile,
  buildRequest,
  executeRequest,
  validateCollectionFile,
  resolveEnvChain,
  loadEnvFile,
  executeGraphQL,
  runWebSocketScenario,
  runSseScenario,
  runBenchmark,
  createMockServer,
  getHistory,
  generateMarkdown,
  generateHtml,
  encryptEnvFile,
  decryptEnvFile,
  generateCodeSnippet,
  parseAuthProfile,
  runDiffScenario,
} from '@flint/core';
import type { MockServerHandle } from '@flint/core';

import type { WorkspaceConfig } from './index.js';

interface ActiveMock {
  logic: MockServerHandle & { handle: (method: string, path: string) => Promise<{ status: number; headers: Record<string, string>; body: unknown; delay: number }> };
  server: Server;
}

let activeMock: ActiveMock | null = null;

export function registerIpcHandlers(
  workspaceRef: { root: string },
  config: WorkspaceConfig,
  saveConfig: (c: WorkspaceConfig) => void,
): void {
  const collectionsDir = () => join(workspaceRef.root, 'collections');
  const environmentsDir = () => join(workspaceRef.root, 'environments');
  const historyDir = () => join(workspaceRef.root, '.flint', 'history');
  const authDir = () => join(workspaceRef.root, '.flint', 'auth');

  // run-scenario
  ipcMain.handle('run-scenario', async (_event, args) => {
    const { scenarioPath, env = 'base' } = args as { scenarioPath: string; env?: string };
    const scenario = parseScenarioFile(scenarioPath);
    const index = await buildCollectionIndex(collectionsDir());
    const envMap = resolveEnvChain(environmentsDir(), env);
    return runScenario(scenario, index, envMap);
  });

  // get-collections — returns Collection[] grouped by first-level subfolder
  ipcMain.handle('get-collections', async (_event, args) => {
    const { collectionsDir: dir } = (args ?? {}) as { collectionsDir?: string };
    return buildCollections(dir ?? collectionsDir());
  });

  // build-request
  ipcMain.handle('build-request', async (_event, args) => {
    const { collectionFile, env = 'base' } = args as { collectionFile: string; env?: string };
    const collection = parseCollectionFile(collectionFile);
    const envMap = resolveEnvChain(environmentsDir(), env);
    return buildRequest(collection, envMap);
  });

  // execute-request
  ipcMain.handle('execute-request', async (_event, args) => {
    const { request } = args as { request: Parameters<typeof executeRequest>[0] };
    return executeRequest(request);
  });

  // validate-collection
  ipcMain.handle('validate-collection', async (_event, args) => {
    const { filePath } = args as { filePath: string };
    return validateCollectionFile(filePath);
  });

  // list-environments
  ipcMain.handle('list-environments', async (_event, args) => {
    const { environmentsDir: dir } = (args ?? {}) as { environmentsDir?: string };
    const { readdirSync } = await import('node:fs');
    try {
      return readdirSync(dir ?? environmentsDir())
        .filter((f) => f.endsWith('.env'))
        .map((f) => f.replace(/\.env$/, ''));
    } catch {
      return [];
    }
  });

  // load-env
  ipcMain.handle('load-env', async (_event, args) => {
    const { envName, environmentsDir: dir } = args as { envName: string; environmentsDir?: string };
    return resolveEnvChain(dir ?? environmentsDir(), envName);
  });

  // execute-graphql
  ipcMain.handle('execute-graphql', async (_event, args) => {
    const { endpoint, request, env = 'base' } = args as {
      endpoint: string;
      request: Parameters<typeof executeGraphQL>[1];
      env?: string;
    };
    const envMap = resolveEnvChain(environmentsDir(), env);
    const headers = Object.fromEntries(
      Object.entries(envMap).filter(([k]) => k.startsWith('header.')),
    );
    return executeGraphQL(endpoint, request, headers);
  });

  // run-websocket
  ipcMain.handle('run-websocket', async (_event, args) => {
    const { scenarioPath, env = 'base' } = args as { scenarioPath: string; env?: string };
    const { readFileSync } = await import('node:fs');
    const { default: yaml } = await import('js-yaml');
    const raw = yaml.load(readFileSync(scenarioPath, 'utf8')) as Parameters<typeof runWebSocketScenario>[0];
    const envMap = resolveEnvChain(environmentsDir(), env);
    const steps = await runWebSocketScenario(raw, envMap);
    return { steps, passed: steps.every((s) => s.passed) };
  });

  // run-sse
  ipcMain.handle('run-sse', async (_event, args) => {
    const { scenarioPath, env = 'base' } = args as { scenarioPath: string; env?: string };
    const { readFileSync } = await import('node:fs');
    const { default: yaml } = await import('js-yaml');
    const raw = yaml.load(readFileSync(scenarioPath, 'utf8')) as Parameters<typeof runSseScenario>[0];
    const envMap = resolveEnvChain(environmentsDir(), env);
    const steps = await runSseScenario(raw, envMap);
    return { steps, passed: steps.every((s) => s.passed) };
  });

  // run-bench
  ipcMain.handle('run-bench', async (_event, args) => {
    const { scenarioPath, options = {}, env = 'base' } = args as {
      scenarioPath: string;
      options?: Partial<Parameters<typeof runBenchmark>[3]>;
      env?: string;
    };
    const scenario = parseScenarioFile(scenarioPath);
    const index = await buildCollectionIndex(collectionsDir());
    const envMap = resolveEnvChain(environmentsDir(), env);
    return runBenchmark(scenario, index, envMap, {
      concurrent: 1,
      duration: 10,
      rampUpSeconds: 0,
      maxRequests: undefined,
      ...options,
    } as Parameters<typeof runBenchmark>[3]);
  });

  // start-mock
  ipcMain.handle('start-mock', async (_event, args) => {
    const { port = 4000, collectionsDir: dir } = (args ?? {}) as {
      port?: number;
      collectionsDir?: string;
    };
    if (activeMock) {
      await activeMock.logic.stop();
      await new Promise<void>((resolve) => activeMock!.server.close(() => resolve()));
      activeMock = null;
    }
    const index = await buildCollectionIndex(dir ?? collectionsDir());
    const collections = Array.from(index.values());
    const logic = createMockServer(collections) as ActiveMock['logic'];
    const server = createServer((req, res) => {
      const method = (req.method ?? 'GET').toUpperCase();
      const path = (req.url ?? '/').split('?')[0];
      void logic.handle(method, path).then((result) => {
        res.writeHead(result.status, result.headers);
        const body = result.body;
        if (body == null) res.end();
        else if (typeof body === 'string') res.end(body);
        else res.end(JSON.stringify(body));
      }).catch((err: Error) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });
    });
    await new Promise<void>((resolve) => server.listen(port, resolve));
    activeMock = { logic, server };
    return { url: `http://localhost:${port}` };
  });

  // stop-mock
  ipcMain.handle('stop-mock', async () => {
    if (activeMock) {
      await activeMock.logic.stop();
      await new Promise<void>((resolve) => activeMock!.server.close(() => resolve()));
      activeMock = null;
    }
  });

  // get-history
  ipcMain.handle('get-history', async (_event, args) => {
    const { operationId, limit } = args as { operationId: string; limit?: number };
    return getHistory(operationId, historyDir(), limit);
  });

  // generate-docs
  ipcMain.handle('generate-docs', async (_event, args) => {
    const { format = 'markdown', outputDir = join(workspaceRef.root, 'docs') } = (args ?? {}) as {
      format?: 'markdown' | 'html';
      outputDir?: string;
    };
    const index = await buildCollectionIndex(collectionsDir());
    const collections = Array.from(index.values());
    const opts = { includeExamples: false, includeAssertions: true, includeSchemas: true, title: 'Flint API Docs' };

    let content: string;
    let fileName: string;
    if (format === 'html') {
      content = generateHtml(collections, opts);
      fileName = 'index.html';
    } else {
      content = generateMarkdown(collections, opts);
      fileName = 'README.md';
    }

    mkdirSync(outputDir, { recursive: true });
    const filePath = join(outputDir, fileName);
    writeFileSync(filePath, content, 'utf8');
    return { format, content, filePath };
  });

  // encrypt-vault
  ipcMain.handle('encrypt-vault', async (_event, args) => {
    const { envPath, key } = args as { envPath: string; key: string };
    return encryptEnvFile(envPath, key);
  });

  // decrypt-vault
  ipcMain.handle('decrypt-vault', async (_event, args) => {
    const { vaultPath, key } = args as { vaultPath: string; key: string };
    return decryptEnvFile(vaultPath, key);
  });

  // generate-snippet
  ipcMain.handle('generate-snippet', async (_event, args) => {
    const { request, target } = args as {
      request: Parameters<typeof generateCodeSnippet>[0];
      target: Parameters<typeof generateCodeSnippet>[1];
    };
    return generateCodeSnippet(request, target);
  });

  // get-auth-profiles
  ipcMain.handle('get-auth-profiles', async () => {
    const { readdirSync } = await import('node:fs');
    try {
      const files = readdirSync(authDir()).filter((f) => f.endsWith('.yaml'));
      return files.map((f) => parseAuthProfile(join(authDir(), f)));
    } catch {
      return [];
    }
  });

  // run-diff-scenario
  ipcMain.handle('run-diff-scenario', async (_event, args) => {
    const { scenarioPath, envA, envB } = args as {
      scenarioPath: string;
      envA: string;
      envB: string;
    };
    const scenario = parseScenarioFile(scenarioPath);
    const index = await buildCollectionIndex(collectionsDir());
    const mapA = resolveEnvChain(environmentsDir(), envA);
    const mapB = resolveEnvChain(environmentsDir(), envB);
    return runDiffScenario(scenario, index, mapA, mapB);
  });

  // get-workspace-root
  ipcMain.handle('get-workspace-root', () => workspaceRef.root);

  // list-workspaces
  ipcMain.handle('list-workspaces', () => ({
    paths: config.workspaces,
    active: config.active,
  }));

  // add-workspace
  ipcMain.handle('add-workspace', (_event, args) => {
    const { path } = args as { path: string };
    if (!existsSync(path)) return { paths: config.workspaces, active: config.active };
    if (!config.workspaces.includes(path)) {
      config.workspaces.push(path);
    }
    saveConfig(config);
    return { paths: config.workspaces, active: config.active };
  });

  // remove-workspace
  ipcMain.handle('remove-workspace', (_event, args) => {
    const { path } = args as { path: string };
    config.workspaces = config.workspaces.filter((w) => w !== path);
    if (config.active === path) {
      config.active = config.workspaces[0] ?? workspaceRef.root;
      workspaceRef.root = config.active;
    }
    saveConfig(config);
    return { paths: config.workspaces, active: config.active };
  });

  // switch-workspace
  ipcMain.handle('switch-workspace', (_event, args) => {
    const { path } = args as { path: string };
    if (!config.workspaces.includes(path)) {
      config.workspaces.push(path);
    }
    config.active = path;
    workspaceRef.root = path;
    saveConfig(config);
    return { paths: config.workspaces, active: config.active };
  });
}
