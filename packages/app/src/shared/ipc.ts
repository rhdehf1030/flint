/**
 * IPC channel definitions shared between main and renderer.
 * Each request/response pair is a discriminated union by `channel`.
 */

import type {
  ScenarioResult,
  BenchmarkResult,
  BenchmarkOptions,
  Collection,
  HistoryEntry,
  DocumentationOutput,
  EncryptedEnvFile,
  EnvMap,
  GraphQLRequest,
  GraphQLResponse,
  DiffRunResult,
  CodeSnippet,
  SnippetTarget,
  AuthProfile,
  HttpRequest,
  HttpResponse,
} from '@flint/core';

/** Minimal validation result shape (mirrors ValidationResult from @flint/core) */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{ message: string; path?: string }>;
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export type IpcRequest =
  | { channel: 'run-scenario'; scenarioPath: string; env?: string }
  | { channel: 'get-collections'; collectionsDir?: string }
  | { channel: 'build-request'; collectionFile: string; env?: string }
  | { channel: 'execute-request'; request: HttpRequest }
  | { channel: 'validate-collection'; filePath: string }
  | { channel: 'list-environments'; environmentsDir?: string }
  | { channel: 'load-env'; envName: string; environmentsDir?: string }
  | { channel: 'execute-graphql'; endpoint: string; request: GraphQLRequest; env?: string }
  | { channel: 'run-websocket'; scenarioPath: string; env?: string }
  | { channel: 'run-sse'; scenarioPath: string; env?: string }
  | { channel: 'run-bench'; scenarioPath: string; options?: Partial<BenchmarkOptions>; env?: string }
  | { channel: 'start-mock'; port?: number; collectionsDir?: string }
  | { channel: 'stop-mock' }
  | { channel: 'get-history'; operationId: string; limit?: number }
  | { channel: 'generate-docs'; format?: 'markdown' | 'html'; outputDir?: string }
  | { channel: 'encrypt-vault'; envPath: string; key: string }
  | { channel: 'decrypt-vault'; vaultPath: string; key: string }
  | { channel: 'generate-snippet'; request: HttpRequest; target: SnippetTarget }
  | { channel: 'get-auth-profiles' }
  | { channel: 'run-diff-scenario'; scenarioPath: string; envA: string; envB: string }
  | { channel: 'open-workspace' }
  | { channel: 'get-workspace-root' }
  | { channel: 'list-workspaces' }
  | { channel: 'add-workspace'; path: string }
  | { channel: 'remove-workspace'; path: string }
  | { channel: 'switch-workspace'; path: string };

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export type IpcResponseMap = {
  'run-scenario': ScenarioResult;
  'get-collections': Collection[];
  'build-request': HttpRequest;
  'execute-request': HttpResponse;
  'validate-collection': ValidationResult;
  'list-environments': string[];
  'load-env': EnvMap;
  'execute-graphql': GraphQLResponse;
  'run-websocket': ScenarioResult;
  'run-sse': ScenarioResult;
  'run-bench': BenchmarkResult;
  'start-mock': { url: string };
  'stop-mock': void;
  'get-history': HistoryEntry[];
  'generate-docs': DocumentationOutput;
  'encrypt-vault': EncryptedEnvFile;
  'decrypt-vault': EnvMap;
  'generate-snippet': CodeSnippet;
  'get-auth-profiles': AuthProfile[];
  'run-diff-scenario': DiffRunResult;
  'open-workspace': string | null;
  'get-workspace-root': string;
  'list-workspaces': { paths: string[]; active: string };
  'add-workspace': { paths: string[]; active: string };
  'remove-workspace': { paths: string[]; active: string };
  'switch-workspace': { paths: string[]; active: string };
};

export type IpcChannel = IpcRequest['channel'];

export type IpcResponse<C extends IpcChannel> = IpcResponseMap[C];

// ---------------------------------------------------------------------------
// Typed invoke helper (used in preload & renderer)
// ---------------------------------------------------------------------------

export type FlintBridge = {
  invoke<C extends IpcChannel>(
    channel: C,
    args: Extract<IpcRequest, { channel: C }>,
  ): Promise<IpcResponse<C>>;
};
