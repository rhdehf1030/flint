# Flint — Package Structure & Architecture

## 설계 원칙

1. **`core`는 순수 로직 라이브러리** — DOM, Electron API, Node.js 전용 API(`fs`/`path` 직접 접근)를 공개 인터페이스에 노출하지 않는다. 모든 파일 I/O는 어댑터 함수 주입 또는 사전 파싱된 데이터 전달 방식으로 처리하여 `core`가 Node와 가상 브라우저 WASM 환경 모두에서 테스트 가능하게 유지한다.
2. **모든 파일 포맷은 유효한 OpenAPI 3.x 문서** — `x-flint` 확장 필드 포함. Flint 외 다른 OpenAPI 호환 도구에서도 열 수 있는 독점 포맷 없음.
3. **IPC는 완전히 타입화** — Electron main/renderer 경계에서 `any` 사용 금지. 모든 채널은 식별 유니언 타입으로 정의.
4. **MCP 서버는 얇은 어댑터** — `@flint/core` 함수를 호출하고 결과를 직렬화할 뿐, 비즈니스 로직 없음.
5. **`{{VAR_NAME}}` 보간 문법** — OpenAPI `example` 필드 규약과 동일. raw OpenAPI 파일에서도 유효.
6. **프로토콜 확장** — `x-flint: { protocol: graphql|websocket|sse }` 필드로 REST 외 프로토콜 구분. 미지정 시 기본값 `http`.
7. **시크릿은 항상 암호화 후 저장** — 인증 프로파일의 민감 값은 vault 암호화 적용. Git 커밋 안전.

---

## 디렉토리 트리

### packages/core

```
packages/core/
├── src/
│   ├── types/
│   │   ├── http.ts               # HttpMethod, HttpRequest, HttpResponse, BodyType
│   │   ├── collection.ts         # CollectionRequest, FlintExtension, AssertionRule
│   │   ├── scenario.ts           # ScenarioFile, ScenarioStep, ExtractMap
│   │   ├── environment.ts        # Environment, EnvMap, EnvInheritanceChain
│   │   ├── result.ts             # StepResult, ScenarioResult, AssertionResult, FailureDiff
│   │   ├── snippet.ts            # SnippetTarget, CodeSnippet
│   │   ├── history.ts            # HistoryEntry, ResponseDiff, DiffField, DiffType
│   │   ├── auth.ts               # AuthProfile, AuthType, OAuth2Config, JwtConfig
│   │   ├── benchmark.ts          # BenchmarkOptions, BenchmarkResult, LatencyHistogram
│   │   ├── mock.ts               # MockServerConfig, MockServerHandle, MockRoute
│   │   ├── graphql.ts            # GraphQLRequest, GraphQLResponse, GraphQLOperationType
│   │   ├── realtime.ts           # WebSocketStep, SseStep, RealtimeMessage
│   │   ├── diff-run.ts           # DiffRunOptions, DiffRunResult, ResponseComparison
│   │   ├── docs.ts               # DocumentationOptions, DocumentationOutput, DocFormat
│   │   ├── vault.ts              # VaultOptions, EncryptedEnvFile, VaultMetadata
│   │   └── index.ts              # 모든 타입 re-export
│   ├── env/
│   │   ├── envLoader.ts          # loadEnvFile(path): EnvMap
│   │   ├── envResolver.ts        # resolveEnvChain(envDir, envName): EnvMap
│   │   └── variableInterpolator.ts # interpolate(template, vars, strict?): string
│   ├── vault/
│   │   ├── vaultEncryptor.ts     # encryptEnvFile(envPath, key): EncryptedEnvFile
│   │   ├── vaultDecryptor.ts     # decryptEnvFile(vaultPath, key): EnvMap
│   │   └── vaultKeyDerivation.ts # deriveKey(passphrase, salt): Buffer
│   ├── collection/
│   │   ├── collectionParser.ts   # parseCollectionFile(path), parseCollectionContent(str)
│   │   └── collectionIndex.ts    # buildCollectionIndex(dir): Map<operationId, CollectionRequest>
│   ├── scenario/
│   │   ├── scenarioParser.ts     # parseScenarioFile(path), parseScenarioContent(str)
│   │   ├── scenarioRunner.ts     # runScenario(scenario, index, env): ScenarioResult
│   │   ├── parallelRunner.ts     # runScenariosInParallel(scenarios, index, env, n)
│   │   └── extractVariables.ts   # extractVariables(response, extractMap): EnvMap
│   ├── http/
│   │   ├── requestBuilder.ts     # buildRequest(collection, vars, overrides?): HttpRequest
│   │   └── httpClient.ts         # executeRequest(request): HttpResponse
│   ├── assertions/
│   │   ├── assertionEvaluator.ts # evaluateAssertions(rules, response): AssertionResult[]
│   │   └── diffReporter.ts       # generateFailureDiff(expected, actual): FailureDiff
│   ├── history/
│   │   ├── historyStore.ts       # saveHistoryEntry(entry, dir): void
│   │   ├── historyReader.ts      # getHistory(operationId, dir, limit?): HistoryEntry[]
│   │   └── responseComparator.ts # compareResponses(a, b): ResponseDiff
│   ├── snippet/
│   │   └── snippetGenerator.ts   # generateCodeSnippet(request, target): string
│   ├── auth/
│   │   ├── authResolver.ts       # resolveAuth(profile, vars): RequestHeaders
│   │   ├── jwtHandler.ts         # isJwtExpired(token), refreshJwt(config, vars)
│   │   ├── oauth2Handler.ts      # startOAuth2Flow(config): string (access token)
│   │   └── authProfileParser.ts  # parseAuthProfile(path): AuthProfile
│   ├── graphql/
│   │   ├── graphqlClient.ts      # executeGraphQL(endpoint, request, headers)
│   │   ├── introspectionClient.ts# fetchSchema(endpoint, headers): GraphQLSchema
│   │   └── graphqlParser.ts      # parseGraphQLCollection(content): GraphQLRequest
│   ├── realtime/
│   │   ├── webSocketRunner.ts    # runWebSocketScenario(scenario, vars): StepResult[]
│   │   └── sseRunner.ts          # runSseScenario(scenario, vars): StepResult[]
│   ├── benchmark/
│   │   └── benchmarkRunner.ts    # runBenchmark(scenario, index, env, options)
│   ├── mock/
│   │   ├── mockRequestMatcher.ts # matchRequest(req, collections): CollectionRequest|null
│   │   ├── mockResponseGenerator.ts # generateMockResponse(collection, params)
│   │   └── mockServer.ts         # createMockServer(collections): MockServerHandle
│   ├── diff-run/
│   │   └── diffScenarioRunner.ts # runDiffScenario(scenario, index, envA, envB)
│   ├── docs/
│   │   ├── markdownGenerator.ts  # generateMarkdown(collections, options): string
│   │   └── htmlGenerator.ts      # generateHtml(collections, options): string
│   ├── openapi/
│   │   ├── openapiImporter.ts    # importFromOpenAPI(spec): CollectionRequest[]
│   │   ├── swagger2Importer.ts   # importFromSwagger2(spec): CollectionRequest[]
│   │   ├── postmanImporter.ts    # importFromPostmanV21(collection): CollectionRequest[]
│   │   ├── openapiExporter.ts    # exportToOpenAPI(requests): OpenAPIV3.Document
│   │   ├── openapiValidator.ts   # validateCollectionFile(path): ValidationResult
│   │   └── scenarioGenerator.ts  # generateScenarioFromOpenAPI(spec): ScenarioFile
│   ├── git/
│   │   └── commitAnalyzer.ts     # analyzeCommit(message, scenariosDir): string[]
│   └── index.ts                  # 전체 공개 API
├── tests/
│   ├── env/
│   ├── vault/
│   ├── collection/
│   ├── scenario/
│   ├── http/
│   ├── assertions/
│   ├── history/
│   ├── snippet/
│   ├── auth/
│   ├── graphql/
│   ├── realtime/
│   ├── benchmark/
│   ├── mock/
│   ├── diff-run/
│   ├── docs/
│   └── openapi/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### packages/cli

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── run.ts          # flint run <scenario> [--env] [--reporter] [--compare]
│   │   ├── watch.ts        # flint watch
│   │   ├── validate.ts     # flint validate <path>
│   │   ├── import.ts       # flint import <file>
│   │   ├── export.ts       # flint export [--format openapi]
│   │   ├── bench.ts        # flint bench <scenario> [--concurrent] [--duration]
│   │   ├── mock.ts         # flint mock [--port] [--collection]
│   │   ├── vault.ts        # flint vault encrypt|decrypt <file>
│   │   ├── docs.ts         # flint docs [--output] [--format] [--include-examples]
│   │   └── hookInstall.ts  # flint hook install|remove
│   ├── reporters/
│   │   ├── prettyReporter.ts
│   │   ├── jsonReporter.ts
│   │   ├── junitReporter.ts
│   │   ├── githubActionsReporter.ts
│   │   ├── diffReporter.ts     # DiffRunResult 컬러 diff 출력
│   │   ├── benchReporter.ts    # BenchmarkResult histogram
│   │   └── index.ts            # getReporter 팩토리
│   └── index.ts
├── tests/
│   ├── fixtures/
│   │   ├── collections/
│   │   ├── scenarios/
│   │   └── environments/
│   ├── run.test.ts
│   ├── validate.test.ts
│   ├── import.test.ts
│   └── reporter-json.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### packages/mcp

```
packages/mcp/
├── src/
│   ├── tools/
│   │   ├── runScenario.ts
│   │   ├── getCollections.ts
│   │   ├── createRequest.ts
│   │   ├── getLastResult.ts
│   │   ├── generateScenarioFromOpenAPI.ts
│   │   ├── analyzeFailure.ts
│   │   ├── mockServerStart.ts
│   │   ├── mockServerStop.ts
│   │   ├── runBench.ts
│   │   ├── getHistory.ts
│   │   └── generateDocs.ts
│   ├── store/
│   │   └── resultStore.ts     # bounded LRU store, max 100 ScenarioResult
│   ├── server.ts              # MCP SDK 서버 인스턴스 + 11개 툴 등록
│   └── index.ts               # startMcpServer(port, workspaceRoot): McpServerHandle
├── tests/
│   └── *.test.ts
├── package.json
└── tsconfig.json
```

### packages/app

```
packages/app/
├── src/
│   ├── main/
│   │   ├── index.ts           # Electron 메인 진입점, BrowserWindow, MCP 서버 기동
│   │   └── ipcHandlers.ts     # ipcMain.handle 전체 채널 등록
│   ├── preload/
│   │   └── index.ts           # contextBridge.exposeInMainWorld('flint', { invoke })
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── RequestEditor.tsx
│   │   │   ├── BodyEditor.tsx
│   │   │   ├── ResponseViewer.tsx
│   │   │   ├── CollectionTree.tsx
│   │   │   ├── CollectionSearch.tsx
│   │   │   ├── ScenarioList.tsx
│   │   │   ├── ScenarioResultView.tsx
│   │   │   ├── EnvironmentSelector.tsx
│   │   │   ├── EnvVarTable.tsx
│   │   │   ├── CodeSnippetPanel.tsx   # "Copy as..." 드롭다운
│   │   │   ├── HistoryPanel.tsx       # 이전 응답 목록 + diff 뷰
│   │   │   ├── AuthManagerPanel.tsx   # 인증 프로파일 관리
│   │   │   ├── GraphQLEditor.tsx      # 쿼리 에디터 + 스키마 탐색
│   │   │   ├── WebSocketPanel.tsx     # 실시간 메시지 로그
│   │   │   ├── BenchmarkPanel.tsx     # 부하 테스트 설정 + 차트
│   │   │   └── DocViewer.tsx          # API 문서 미리보기
│   │   └── store/
│   │       └── appStore.ts            # Zustand 전역 상태
│   └── shared/
│       └── ipc.ts                     # IpcRequest, IpcResponse 타입
├── tests/
│   └── e2e/
│       └── *.spec.ts
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── tsconfig.renderer.json
└── vite.config.ts
```

---

## 핵심 TypeScript 인터페이스

### packages/core/src/types/http.ts

```typescript
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type BodyType = 'json' | 'form-data' | 'multipart' | 'raw' | 'none';

export interface RequestHeaders {
  [key: string]: string;
}

export interface QueryParams {
  [key: string]: string | string[];
}

export interface RequestBody {
  type: BodyType;
  json?: unknown;
  formData?: Record<string, string>;
  multipart?: Record<string, string>;
  raw?: string;
}

export interface HttpRequest {
  method: HttpMethod;
  url: string; // 완전히 보간된 URL, {{vars}} 없음
  headers: RequestHeaders;
  queryParams: QueryParams;
  body: RequestBody;
  timeoutMs?: number;        // 기본값: 30000ms
  followRedirects?: boolean; // 기본값: true, 최대 5회
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;       // Content-Type application/json이면 파싱된 객체, 아니면 raw 문자열
  rawBody: string;
  responseTimeMs: number;
}
```

### packages/core/src/types/collection.ts

```typescript
import type { OpenAPIV3 } from 'openapi-types';

export type Protocol = 'http' | 'graphql' | 'websocket' | 'sse';

export interface AssertionRule {
  status?: number;
  responseTime?: { lt: number };
  [bodyOrHeaderPath: string]: unknown;
  // 예: "body.token": "exists"
  // 예: "body.user.age": { schema: { type: "number", minimum: 18 } }
  // 예: "header.content-type": "application/json"
}

export interface FlintMockConfig {
  delay?: number;     // ms 단위 응답 지연
  statusCode?: number; // mock 응답 상태코드 오버라이드
}

export interface FlintExtension {
  assertions?: AssertionRule[];
  baseUrl?: string;
  protocol?: Protocol;           // 기본값: 'http'
  mock?: FlintMockConfig;
  auth?: string;                 // AuthProfile 이름 참조
}

export interface CollectionRequest {
  openapi: '3.0.0';
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: {
    [path: string]: {
      [method: string]: OpenAPIV3.OperationObject & {
        operationId: string;   // REQUIRED — 고유 식별자
        'x-flint'?: FlintExtension;
      };
    };
  };
  servers?: OpenAPIV3.ServerObject[];
}
```

### packages/core/src/types/scenario.ts

```typescript
export interface ExtractMap {
  // key: 다음 step에 주입할 변수명
  // value: 응답 body의 dot-notation 경로 (예: "body.token")
  [variableName: string]: string;
}

export interface StepAssertion {
  [key: string]: unknown;
}

export interface ScenarioStep {
  operationId: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  extract?: ExtractMap;
  assertions?: StepAssertion[];
  auth?: string; // AuthProfile 이름 오버라이드
}

export interface ScenarioFile {
  'x-flint-scenario': {
    name: string;
    version: string;
    environments?: string[]; // 지정 시 해당 환경에서만 실행
    steps: ScenarioStep[];
  };
}
```

### packages/core/src/types/result.ts

```typescript
import type { HttpRequest, HttpResponse } from './http.js';
import type { AssertionRule } from './collection.js';

export interface AssertionResult {
  rule: AssertionRule;
  passed: boolean;
  message: string;
  diff?: FailureDiff;
}

export interface FailureDiff {
  expected: unknown;
  actual: unknown;
  formattedDiff: string;
}

export interface StepResult {
  stepIndex: number;
  operationId: string;
  request: HttpRequest;
  response: HttpResponse;
  assertions: AssertionResult[];
  extractedVars: Record<string, string>;
  passed: boolean;
  durationMs: number;
}

export interface ScenarioResult {
  id: string;           // uuid v4 — MCP get_last_result / analyze_failure 참조용
  scenarioName: string;
  scenarioPath: string;
  env: string;
  steps: StepResult[];
  passed: boolean;
  totalDurationMs: number;
  startedAt: string;    // ISO 8601
  finishedAt: string;   // ISO 8601
}
```

### packages/core/src/types/snippet.ts

```typescript
export type SnippetTarget = 'curl' | 'fetch' | 'axios' | 'python-requests' | 'go-http' | 'httpie';

export interface CodeSnippet {
  target: SnippetTarget;
  language: string;  // 'bash' | 'javascript' | 'typescript' | 'python' | 'go'
  code: string;
}
```

### packages/core/src/types/history.ts

```typescript
import type { HttpRequest, HttpResponse } from './http.js';

export interface HistoryEntry {
  id: string;        // uuid v4
  operationId: string;
  timestamp: string; // ISO 8601
  request: HttpRequest;
  response: HttpResponse;
}

export type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffField {
  path: string;      // dot-notation 경로 (예: "body.user.age")
  type: DiffType;
  before?: unknown;
  after?: unknown;
  typeChanged?: boolean; // string → number 같은 타입 변경
}

export interface ResponseDiff {
  statusChanged: boolean;
  statusBefore?: number;
  statusAfter?: number;
  fields: DiffField[];
  hasDiff: boolean;
}
```

### packages/core/src/types/auth.ts

```typescript
export type AuthType = 'oauth2' | 'jwt' | 'api-key' | 'basic' | 'bearer';

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;  // PKCE 사용 시 불필요
  scopes: string[];
  redirectUri?: string;   // 기본값: http://localhost:9876/callback
  usePkce?: boolean;      // 기본값: true
}

export interface JwtConfig {
  token: string;           // 변수 참조 가능: "{{ACCESS_TOKEN}}"
  refreshToken?: string;   // "{{REFRESH_TOKEN}}"
  refreshUrl?: string;
  expiresAt?: string;      // ISO 8601 또는 변수 참조
}

export interface ApiKeyConfig {
  key: string;             // 변수 참조 가능
  headerName?: string;     // Header 방식 시 헤더 이름 (예: "X-API-Key")
  queryParam?: string;     // Query Param 방식 시 파라미터 이름
}

export interface BasicAuthConfig {
  username: string;
  password: string;
}

export interface BearerConfig {
  token: string;
}

export interface AuthProfile {
  name: string;
  type: AuthType;
  oauth2?: OAuth2Config;
  jwt?: JwtConfig;
  apiKey?: ApiKeyConfig;
  basic?: BasicAuthConfig;
  bearer?: BearerConfig;
}
```

### packages/core/src/types/benchmark.ts

```typescript
export interface BenchmarkOptions {
  concurrent: number;      // 동시 요청 수 (기본값: 10)
  duration?: number;       // 초 단위 (duration 또는 maxRequests 중 하나 필수)
  maxRequests?: number;    // 총 요청 상한
  rampUpSeconds?: number;  // 워밍업 시간 (기본값: 0)
  timeoutMs?: number;      // 개별 요청 타임아웃 (기본값: 10000ms)
}

export interface PercentileStats {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  mean: number;
}

export interface BenchmarkResult {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  successRate: number;    // 0.0 ~ 1.0
  errorRate: number;
  rps: number;            // requests per second
  totalDurationMs: number;
  latency: PercentileStats; // ms 단위
  errors: Array<{ status: number; count: number }>;
}
```

### packages/core/src/types/mock.ts

```typescript
export interface MockServerConfig {
  collections: import('./collection.js').CollectionRequest[];
  defaultDelay?: number;    // ms, 기본값: 0
  verbose?: boolean;
}

export interface MockServerHandle {
  baseUrl: string;          // 예: "http://localhost:4000"
  stop(): Promise<void>;
}

export interface MockRoute {
  method: string;
  path: string;             // Express-style path (예: "/users/:id")
  operationId: string;
}

export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  delay: number;            // ms
}
```

### packages/core/src/types/graphql.ts

```typescript
export type GraphQLOperationType = 'query' | 'mutation' | 'subscription';

export interface GraphQLRequest {
  operationType: GraphQLOperationType;
  query: string;           // GraphQL query/mutation/subscription 문자열
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
}

export interface GraphQLField {
  name: string;
  type: string;
  nullable: boolean;
  args?: GraphQLField[];
}

export interface GraphQLSchema {
  types: Record<string, { fields: GraphQLField[] }>;
  queryType?: string;
  mutationType?: string;
  subscriptionType?: string;
}
```

### packages/core/src/types/diff-run.ts

```typescript
import type { ScenarioResult } from './result.js';
import type { ResponseDiff } from './history.js';

export interface DiffRunOptions {
  envAName: string;
  envBName: string;
  stopOnFirstDiff?: boolean; // 기본값: false
}

export interface ResponseComparison {
  stepIndex: number;
  operationId: string;
  envA: { status: number; body: unknown; responseTimeMs: number };
  envB: { status: number; body: unknown; responseTimeMs: number };
  diff: ResponseDiff;
  hasDiff: boolean;
}

export interface DiffRunResult {
  scenarioName: string;
  envAName: string;
  envBName: string;
  comparisons: ResponseComparison[];
  hasDiff: boolean;
  totalDurationMs: number;
}
```

### packages/app/src/shared/ipc.ts

```typescript
import type {
  HttpRequest, HttpResponse,
  CollectionRequest, ScenarioResult, EnvMap,
  BenchmarkOptions, BenchmarkResult,
  DiffRunResult, DiffRunOptions,
  HistoryEntry, DocumentationOptions,
  AuthProfile, GraphQLRequest, GraphQLResponse,
  WebSocketScenario, SseScenario, StepResult,
  SnippetTarget, CodeSnippet,
} from '@flint/core';

export type IpcRequest =
  | { channel: 'execute-request';       payload: HttpRequest }
  | { channel: 'execute-graphql';       payload: { endpoint: string; request: GraphQLRequest; headers: Record<string, string> } }
  | { channel: 'run-scenario';          payload: { scenarioPath: string; env: string } }
  | { channel: 'run-diff-scenario';     payload: { scenarioPath: string; options: DiffRunOptions } }
  | { channel: 'run-websocket';         payload: { scenarioPath: string } }
  | { channel: 'run-sse';               payload: { scenarioPath: string } }
  | { channel: 'run-bench';             payload: { scenarioPath: string; options: BenchmarkOptions } }
  | { channel: 'get-collections';       payload: { collectionsDir: string } }
  | { channel: 'load-env';              payload: { envDir: string; envName: string } }
  | { channel: 'save-collection';       payload: { filePath: string; content: string } }
  | { channel: 'open-file-dialog';      payload: { filters?: { name: string; extensions: string[] }[] } }
  | { channel: 'get-workspace-root';    payload: Record<string, never> }
  | { channel: 'start-mock';            payload: { port?: number } }
  | { channel: 'stop-mock';             payload: Record<string, never> }
  | { channel: 'get-history';           payload: { operationId: string; limit?: number } }
  | { channel: 'generate-docs';         payload: { options: DocumentationOptions; outputDir: string } }
  | { channel: 'encrypt-vault';         payload: { envPath: string; key: string } }
  | { channel: 'decrypt-vault';         payload: { vaultPath: string; key: string } }
  | { channel: 'generate-snippet';      payload: { request: HttpRequest; target: SnippetTarget } }
  | { channel: 'get-auth-profiles';     payload: Record<string, never> }
  | { channel: 'validate-collection';   payload: { filePath: string } };

export type IpcResponse =
  | { channel: 'execute-request';       data: HttpResponse }
  | { channel: 'execute-graphql';       data: GraphQLResponse }
  | { channel: 'run-scenario';          data: ScenarioResult }
  | { channel: 'run-diff-scenario';     data: DiffRunResult }
  | { channel: 'run-websocket';         data: StepResult[] }
  | { channel: 'run-sse';               data: StepResult[] }
  | { channel: 'run-bench';             data: BenchmarkResult }
  | { channel: 'get-collections';       data: CollectionRequest[] }
  | { channel: 'load-env';              data: EnvMap }
  | { channel: 'save-collection';       data: { filePath: string } }
  | { channel: 'open-file-dialog';      data: { filePaths: string[] } }
  | { channel: 'get-workspace-root';    data: { root: string } }
  | { channel: 'start-mock';            data: { url: string } }
  | { channel: 'stop-mock';             data: { stopped: boolean } }
  | { channel: 'get-history';           data: HistoryEntry[] }
  | { channel: 'generate-docs';         data: { filePath: string } }
  | { channel: 'encrypt-vault';         data: { vaultPath: string } }
  | { channel: 'decrypt-vault';         data: EnvMap }
  | { channel: 'generate-snippet';      data: CodeSnippet }
  | { channel: 'get-auth-profiles';     data: AuthProfile[] }
  | { channel: 'validate-collection';   data: { valid: boolean; errors: string[] } };

// preload에서 노출하는 전역 타입
export interface FlintBridge {
  invoke<T extends IpcRequest>(
    request: T
  ): Promise<Extract<IpcResponse, { channel: T['channel'] }>['data']>;
}

declare global {
  interface Window {
    flint: FlintBridge;
  }
}
```

---

## 패키지 통신 다이어그램

```
┌──────────────────────────────────────────────────────────────────────┐
│  packages/app (Electron)                                             │
│                                                                      │
│  ┌────────────────────┐  typed IPC  ┌───────────────────────────┐   │
│  │  renderer          │ ◄─────────► │  main process             │   │
│  │  (React)           │             │  ipcHandlers.ts           │   │
│  │                    │             │  └── @flint/core 호출     │   │
│  │  컴포넌트 16개:    │             │  └── @flint/mcp 기동      │   │
│  │  RequestEditor     │             └───────────────────────────┘   │
│  │  ResponseViewer    │                                              │
│  │  CollectionTree    │                                              │
│  │  ScenarioList      │                                              │
│  │  GraphQLEditor     │                                              │
│  │  WebSocketPanel    │                                              │
│  │  BenchmarkPanel    │                                              │
│  │  HistoryPanel      │                                              │
│  │  AuthManagerPanel  │                                              │
│  │  CodeSnippetPanel  │                                              │
│  │  DocViewer         │                                              │
│  │  ... 등            │                                              │
│  └────────────────────┘                                              │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │ imports
              ┌──────────────────┼───────────────────┐
              ▼                  ▼                   ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ @flint/core  │   │  @flint/mcp  │   │  @flint/cli  │
    │              │   │              │   │              │
    │ 순수 로직    │   │ MCP 어댑터   │   │ CLI 커맨드   │
    └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
           │                  │                  │
           └──────────────────┴──────────────────┘
                              │ (모두 @flint/core에 의존)

MCP 서버 (포트 3141)
  │
  ├── GET  /sse      ← MCP 클라이언트 연결 (Claude Code, Cursor 등)
  ├── POST /message  ← 툴 호출
  └── GET  /health   ← 헬스체크

MCP 툴 11개:
  run_scenario, get_collections, create_request,
  get_last_result, generate_scenario_from_openapi, analyze_failure,
  mock_server_start, mock_server_stop, run_bench,
  get_history, generate_docs
```

---

## 데이터 플로우

### 1. 시나리오 실행 시퀀스

```
CLI / App / MCP
  │
  ├─ parseScenarioFile(path)            → ScenarioFile
  ├─ buildCollectionIndex(dir)          → Map<operationId, CollectionRequest>
  ├─ resolveEnvChain(envDir, envName)   → EnvMap (base 병합 완료)
  │
  └─ runScenario(scenario, index, env)
       │
       ├─ 각 step 순서대로:
       │    ├─ operationId 해석        (UnknownOperationError 가능)
       │    ├─ auth 프로파일 해석       resolveAuth(profile, vars) → 헤더 추가
       │    ├─ buildRequest(collection, vars, overrides)  → HttpRequest
       │    ├─ executeRequest(request)                    → HttpResponse
       │    ├─ saveHistoryEntry(entry, historyDir)        → void (비동기, await 불필요)
       │    ├─ evaluateAssertions(rules, response)        → AssertionResult[]
       │    └─ extractVariables(response, extractMap)     → EnvMap (vars에 병합)
       │
       └─ ScenarioResult (id, steps, passed, totalDurationMs)
            │
            ├─ CLI:   reporter.report(result) → stdout
            ├─ MCP:   resultStore.set(result.id, result), JSON 반환
            └─ App:   IPC 응답 → ScenarioResultView 렌더링
```

### 2. Mock 서버 시퀀스

```
CLI: flint mock --port 4000
  │
  ├─ buildCollectionIndex('./collections/')  → Map<operationId, CollectionRequest>
  ├─ createMockServer(collections)           → MockServerHandle (순수 로직)
  └─ HTTP 서버 바인딩 (0.0.0.0:4000)
       │
       ├─ 인입 요청 (예: POST /auth/login)
       │    ├─ matchRequest(req, collections)         → CollectionRequest | null
       │    ├─ null이면 404 응답
       │    └─ generateMockResponse(collection, params)
       │         ├─ example 필드에서 응답 body 추출
       │         ├─ x-flint-mock.delay 적용
       │         └─ MockResponse 반환
       │
       └─ HTTP 응답 전송
```

### 3. 성능 테스트 시퀀스

```
CLI: flint bench ./scenarios/login.yaml --concurrent 50 --duration 30s
  │
  ├─ parseScenarioFile, buildCollectionIndex, resolveEnvChain
  └─ runBenchmark(scenario, index, env, { concurrent: 50, duration: 30 })
       │
       ├─ ramp-up: 0 → concurrent 점진적 증가
       ├─ promise pool (수동 구현, concurrent 크기 유지)
       │    └─ 각 슬롯: runScenario() 호출 → 완료 → 다음 요청 시작
       ├─ 30초 후 pool 종료
       ├─ latency 수집 → p50/p75/p90/p95/p99 계산
       └─ BenchmarkResult 반환
            │
            ├─ CLI:   benchReporter.report(result) → histogram 차트
            └─ MCP:   JSON 반환
```

---

## 핵심 설계 결정 및 근거

### 1. `undici` over native `fetch` or `node:http`

Node 18+의 `fetch`는 타임아웃 세밀 제어, connection 재사용, form-data multipart boundary 처리가 부족하다. `undici`는 Node의 fetch가 내부적으로 사용하는 라이브러리이며 `MockAgent`로 실서버 없이 HTTP를 인터셉트할 수 있어 단위 테스트에 필수적이다.

### 2. 요청 1개당 YAML 1파일

표준 OpenAPI는 모든 path를 하나의 문서에 모은다. Flint는 path 1개당 파일 1개로 저장하여 `git diff`가 단일 오퍼레이션 변경으로 스코프되게 한다. `collectionIndex.ts`가 런타임에 가상 멀티-path 뷰를 조립하고, `openapiExporter.ts`가 export 시 표준 OpenAPI 문서로 재조립한다.

### 3. `x-flint`는 operationObject 형제 노드

OpenAPI 3.x 스펙은 `x-` 접두사 확장 필드를 허용한다. `x-flint` 블록을 operation 내부에 두면 외부 도구가 무시하고도 파일을 열 수 있다. 별도 파일 확장자나 스키마 없이 OpenAPI 3.x 완벽 호환이 유지된다.

### 4. `ScenarioResult.id`는 런타임에 할당되는 UUID

MCP 툴 `get_last_result`와 `analyze_failure`가 이 id로 결과를 참조한다. MCP 서버는 bounded LRU store (최대 100개)를 인메모리로 유지하며 disk 저장은 하지 않는다. 미래에 `.flint/results/`로 disk 저장 기능 추가 가능.

### 5. Electron preload는 `contextBridge`만 사용

보안 요구사항. 렌더러는 Node API에 직접 접근 없음. 모든 Node/Electron 접근은 `packages/app/src/shared/ipc.ts`에 정의된 타입 IPC 브릿지를 통한다. preload가 노출하는 전역: `window.flint = { invoke(req): Promise<res> }` 하나뿐.

### 6. MCP 서버는 Electron 메인 프로세스에서 기동

MCP 서버가 `0.0.0.0:3141`에 바인딩된다. `startMcpServer(3141, workspaceRoot)`를 `packages/app/src/main/index.ts`의 `app.ready` 이후 호출한다. `workspaceRoot`는 앱에서 사용자가 열기한 workspace 디렉토리이며 렌더러 IPC로 전달받는다. `app.on('quit')` 시 정상 종료.

### 7. 환경변수 마스킹

`SECRET`, `PASSWORD`, `TOKEN`, `KEY` 문자열을 포함하는 키(대소문자 무시)는 `EnvVarTable`에서 `••••••••`로 표시된다. 실제 값은 사용자가 "reveal" 클릭 시만 IPC로 렌더러에 전달된다. 스크린샷/화면 공유 시 시크릿 노출 방지.

### 8. `core`의 공개 API에 `fs` 의존성 최소화

`parseCollectionFile(filePath)` (disk에서 읽기)와 `parseCollectionContent(content: string)` (문자열에서 파싱) 둘 다 제공한다. 테스트나 어댑터가 인메모리 콘텐츠를 제공하려면 하위 레벨 파싱 함수를 직접 호출할 수 있다.

### 9. 병렬 실행은 수동 promise pool

`p-limit` 같은 외부 라이브러리 없이 `parallelRunner.ts`가 단순한 concurrency-limiting pool을 구현한다: in-flight promise set을 유지하고, set이 capacity에 달하면 가장 빠른 완료를 await한 후 다음을 시작한다. `core` 의존성을 최소화하고 테스트가 명확하다.

### 10. 어서션 규칙은 단일 키 오브젝트

YAML 형식 `- body.token: exists` (하나의 키를 가진 매핑)은 개발자가 자연스럽게 읽고 쓸 수 있다. `assertionEvaluator.ts`는 각 규칙 오브젝트의 키를 검사해 어서션 타입을 결정한다. 정확히 하나의 의미있는 키만 허용하며 위반 시 명확한 오류 메시지 제공.

### 11. 프로토콜 확장은 x-flint.protocol 필드

`x-flint: { protocol: graphql|websocket|sse }` 미지정 시 `http`가 기본. 동일한 collectionParser/scenarioRunner 진입점을 유지하면서 `protocol` 값에 따라 내부적으로 전문 실행 엔진(graphqlClient, webSocketRunner, sseRunner)으로 분기한다.

### 12. 시크릿 볼트: AES-256-GCM + PBKDF2

`AES-256-GCM`으로 각 VALUE를 개별 암호화하여 KEY는 평문으로 유지한다. Git에서 어떤 환경변수가 존재하는지 검색 가능하지만 값은 보호된다. 키 파생은 `PBKDF2 (100000 iterations, SHA-256)`로 passphrase brute-force를 어렵게 한다.

### 13. 히스토리는 파일시스템 저장, 최근 50개 유지

`.flint/history/<operationId>/<ISO timestamp>.json`로 저장. 50개 초과 시 가장 오래된 파일 자동 삭제. ScenarioResult와 별개로 단일 요청 레벨의 응답 히스토리이므로 UI에서 operationId 기준으로 빠르게 조회 가능.

### 14. Mock 서버: core는 순수 로직, 포트 바인딩은 호출자가 담당

`createMockServer(collections)`는 요청 매칭/응답 생성 로직만 반환하는 `MockServerHandle`을 리턴한다. CLI의 `mock.ts`와 MCP의 `mockServerStart.ts`가 각자의 HTTP 서버 프레임워크 (express)로 포트 바인딩을 처리한다. `core` 테스트에서 실제 포트 바인딩 없이 mock 로직 단위 테스트 가능.

### 15. 성능 테스트는 기존 ScenarioRunner 재사용

`benchmarkRunner.ts`는 `runScenario`를 반복 호출하는 wrapper다. 별도 HTTP 레이어를 구현하지 않고 scenarioRunner의 모든 기능(어서션, 변수 추출)이 벤치마크 중에도 동작한다. 성능 테스트는 "기능 정확성 + 성능"을 동시에 검증한다.

---

## .flint 워크스페이스 구조

```
{workspaceRoot}/
├── collections/
│   ├── auth/
│   │   ├── login.yaml
│   │   └── logout.yaml
│   └── users/
│       ├── get-profile.yaml
│       └── update-profile.yaml
├── scenarios/
│   ├── user-flow.yaml
│   └── admin-flow.yaml
├── environments/
│   ├── base.env
│   ├── staging.env
│   └── production.env.vault    # 암호화된 파일
├── auth/
│   ├── staging-oauth.yaml
│   └── production-api-key.yaml
└── .flint/
    ├── history/
    │   └── auth-login/
    │       ├── 2026-02-26T10:00:00.000Z.json
    │       └── 2026-02-26T11:00:00.000Z.json
    └── results/
        └── (미래: ScenarioResult disk 저장)
```

---

## MCP 클라이언트 설정 예시

```json
// .claude/mcp.json
{
  "mcpServers": {
    "flint": {
      "url": "http://localhost:3141/sse"
    }
  }
}
```

---

## 의존성 목록

### packages/core
| 패키지 | 용도 |
|--------|------|
| `js-yaml` | YAML 파싱 |
| `undici` | HTTP 클라이언트 (MockAgent 포함) |
| `ajv` | JSON Schema 어서션 |
| `ajv-formats` | ajv 포맷 플러그인 |
| `openapi-types` | OpenAPI 타입 정의만 (런타임 없음) |
| `@apidevtools/swagger-parser` | OpenAPI 유효성 검사 |

### packages/cli
| 패키지 | 용도 |
|--------|------|
| `commander` | CLI 프레임워크 |
| `chalk` | ANSI 컬러 출력 |
| `chokidar` | 파일 감시 (watch 모드) |
| `ora` | 터미널 스피너 |
| `execa` | 통합 테스트용 프로세스 실행 |

### packages/mcp
| 패키지 | 용도 |
|--------|------|
| `@modelcontextprotocol/sdk` | MCP SDK |
| `express` | SSE/HTTP 서버 |

### packages/app
| 패키지 | 용도 |
|--------|------|
| `electron` | 크로스 플랫폼 데스크탑 |
| `vite` | 번들러 |
| `vite-plugin-electron` | Electron + Vite 통합 |
| `react` + `react-dom` | UI 프레임워크 |
| `@codemirror/*` 또는 `@monaco-editor/react` | 코드 에디터 |
| `zustand` | 전역 상태 관리 |
| `electron-builder` | 앱 패키징 |
