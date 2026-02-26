# Flint — Implementation Task Checklist (PRD)

모든 태스크는 의존성 순서대로 정렬되어 있다. 체크박스가 완료된 태스크만 다음 태스크의 전제로 인정된다.
각 태스크는 독립적으로 완료 가능하며 기계적으로 검증 가능하다 (빌드 성공, 테스트 통과, 파일 존재 확인 등).

---

## infra (모노레포 설정)

- [ ] 루트 `package.json` 생성: `"name": "flint-root"`, `"private": true`, scripts: `build`, `test`, `lint`, `typecheck`, `dev`
- [ ] `pnpm-workspace.yaml` 생성: `packages/core`, `packages/cli`, `packages/app`, `packages/mcp` 선언
- [ ] 루트 `tsconfig.base.json` 생성: `strict: true`, `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `declaration: true`, `declarationMap: true`, `sourceMap: true`, `exactOptionalPropertyTypes: true`
- [ ] 루트 `.eslintrc.js` 생성: `@typescript-eslint/recommended`, `import/no-cycle`, `import/order` 규칙 활성화
- [ ] 루트 `.prettierrc` 생성: 2칸 들여쓰기, 단따옴표, trailing comma, print width 100
- [ ] 루트 `vitest.workspace.ts` 생성: 모든 패키지 vitest 설정 참조
- [ ] `packages/core/package.json` 생성: `"name": "@flint/core"`, `exports` 필드로 ESM + CJS 듀얼 출력, 외부 의존성 없는 순수 로직 패키지
- [ ] `packages/core/tsconfig.json` 생성: `../../tsconfig.base.json` 확장, `outDir: dist`, `rootDir: src`
- [ ] `packages/core/vitest.config.ts` 생성: 커버리지 threshold 80%
- [ ] `packages/cli/package.json` 생성: `"name": "@flint/cli"`, `bin: { flint: "./dist/index.js" }`, `@flint/core` 의존성
- [ ] `packages/cli/tsconfig.json` 생성: base 확장
- [ ] `packages/mcp/package.json` 생성: `"name": "@flint/mcp"`, `@flint/core`, `@modelcontextprotocol/sdk` 의존성
- [ ] `packages/mcp/tsconfig.json` 생성: base 확장
- [ ] `packages/app/package.json` 생성: `"name": "@flint/app"`, electron devDependency, `@flint/core`, `@flint/mcp` 의존성
- [ ] `packages/app/tsconfig.json` 생성: base 확장, 별도 `tsconfig.main.json` (Node target), `tsconfig.renderer.json` (DOM lib)
- [ ] 각 패키지 `src/index.ts` stub 파일 생성 (빈 export)
- [ ] `pnpm install` 에러 없이 완료 확인
- [ ] `pnpm -r build` 빈 패키지로 성공 확인

---

## core

### Types & Interfaces

- [ ] `packages/core/src/types/http.ts` 생성 — `HttpMethod`, `HttpRequest`, `HttpResponse`, `RequestHeaders`, `QueryParams`, `RequestBody`, `BodyType` (json|form-data|multipart|raw|none) 정의 및 export
- [ ] `packages/core/src/types/collection.ts` 생성 — `CollectionRequest` (OpenAPI 3.x YAML 형태), `FlintExtension` (x-flint 블록, protocol/mock/auth/assertions 포함), `AssertionRule` 정의 및 export
- [ ] `packages/core/src/types/scenario.ts` 생성 — `ScenarioFile`, `ScenarioStep`, `ExtractMap`, `StepAssertion` 정의 및 export
- [ ] `packages/core/src/types/environment.ts` 생성 — `Environment`, `EnvMap`, `EnvInheritanceChain` 정의 및 export
- [ ] `packages/core/src/types/result.ts` 생성 — `StepResult`, `ScenarioResult`, `AssertionResult`, `FailureDiff` 정의 및 export
- [ ] `packages/core/src/types/snippet.ts` 생성 — `SnippetTarget` (curl|fetch|axios|python-requests|go-http|httpie), `CodeSnippet` 정의 및 export
- [ ] `packages/core/src/types/history.ts` 생성 — `HistoryEntry`, `ResponseDiff`, `DiffField`, `DiffType` (added|removed|changed|unchanged) 정의 및 export
- [ ] `packages/core/src/types/auth.ts` 생성 — `AuthProfile`, `AuthType` (oauth2|jwt|api-key|basic|bearer), `OAuth2Config`, `JwtConfig`, `ApiKeyConfig`, `BasicAuthConfig` 정의 및 export
- [ ] `packages/core/src/types/benchmark.ts` 생성 — `BenchmarkOptions`, `BenchmarkResult`, `LatencyHistogram`, `PercentileStats` (p50/p75/p90/p95/p99) 정의 및 export
- [ ] `packages/core/src/types/mock.ts` 생성 — `MockServerConfig`, `MockServerHandle`, `MockRoute`, `MockResponse` 정의 및 export
- [ ] `packages/core/src/types/graphql.ts` 생성 — `GraphQLRequest`, `GraphQLResponse`, `GraphQLVariable`, `GraphQLOperationType` (query|mutation|subscription), `GraphQLSchema` 정의 및 export
- [ ] `packages/core/src/types/realtime.ts` 생성 — `WebSocketStep`, `SseStep`, `RealtimeMessage`, `WebSocketScenario`, `SseScenario` 정의 및 export
- [ ] `packages/core/src/types/diff-run.ts` 생성 — `DiffRunOptions`, `DiffRunResult`, `EnvResponsePair`, `ResponseComparison` 정의 및 export
- [ ] `packages/core/src/types/docs.ts` 생성 — `DocumentationOptions`, `DocumentationOutput`, `DocFormat` (markdown|html), `DocSection` 정의 및 export
- [ ] `packages/core/src/types/vault.ts` 생성 — `VaultOptions`, `EncryptedEnvFile`, `VaultMetadata` 정의 및 export
- [ ] `packages/core/src/types/index.ts` 생성 — 위 모든 타입 모듈 re-export

### Environment Engine

- [ ] `packages/core/src/env/envLoader.ts` 구현 — `loadEnvFile(path: string): EnvMap` (.env 파일 파싱: `KEY=VALUE` 형식, `#` 주석, 따옴표 값, 멀티라인 지원)
- [ ] `packages/core/src/env/envResolver.ts` 구현 — `resolveEnvChain(envDir: string, envName: string): EnvMap` (base.env 로드 후 named env 병합, named 값이 base 오버라이드)
- [ ] `packages/core/src/env/variableInterpolator.ts` 구현 — `interpolate(template: string, vars: EnvMap, strict?: boolean): string` (`{{VAR_NAME}}` 치환, strict 모드시 미정의 변수 `InterpolationError` throw)
- [ ] env 모듈 Vitest 단위 테스트 — 기본 로드, 상속 병합, 오버라이드, 미정의 변수 strict/lenient, 중첩 braces 엣지케이스, 따옴표 값, 주석 처리

### Vault (시크릿 볼트)

- [ ] `packages/core/src/vault/vaultEncryptor.ts` 구현 — `encryptEnvFile(envPath: string, key: string): EncryptedEnvFile` (AES-256-GCM, 각 VALUE를 개별 암호화, KEY는 평문 유지 — git 검색 가능)
- [ ] `packages/core/src/vault/vaultDecryptor.ts` 구현 — `decryptEnvFile(vaultPath: string, key: string): EnvMap` (복호화 후 EnvMap 반환)
- [ ] `packages/core/src/vault/vaultKeyDerivation.ts` 구현 — `deriveKey(passphrase: string, salt: Buffer): Buffer` (PBKDF2, 100000 iterations, SHA-256)
- [ ] vault 모듈 Vitest 단위 테스트 — 암호화 후 복호화 라운드트립, 잘못된 키 오류, 손상된 파일 오류

### Collection Parser

- [ ] `packages/core` 패키지에 `js-yaml`, `openapi-types` 의존성 추가
- [ ] `packages/core/src/collection/collectionParser.ts` 구현 — `parseCollectionFile(filePath: string): CollectionRequest`, `parseCollectionContent(content: string): CollectionRequest` (YAML 파싱, 필수 필드 검증, x-flint 블록 추출)
- [ ] `packages/core/src/collection/collectionIndex.ts` 구현 — `buildCollectionIndex(collectionDir: string): Map<string, CollectionRequest>` (디렉토리 재귀 탐색, 모든 .yaml 파싱, operationId 기준 인덱싱)
- [ ] collection 모듈 Vitest 단위 테스트 — 유효한 파일, 누락된 operationId 오류, 잘못된 YAML 오류, x-flint 블록 없음 (선택사항), 중복 operationId 오류, 비yaml 파일 무시

### Scenario Parser

- [ ] `packages/core/src/scenario/scenarioParser.ts` 구현 — `parseScenarioFile(filePath: string): ScenarioFile`, `parseScenarioContent(content: string): ScenarioFile` (x-flint-scenario 루트 키 검증, 각 step의 operationId 검증)
- [ ] scenario parser Vitest 단위 테스트 — 유효한 시나리오, step의 누락된 operationId, 잘못된 YAML, 빈 steps 배열

### HTTP Engine

- [ ] `packages/core` 패키지에 `undici` 의존성 추가
- [ ] `packages/core/src/http/requestBuilder.ts` 구현 — `buildRequest(collection: CollectionRequest, vars: EnvMap, overrides?: Partial<HttpRequest>): HttpRequest` (URL/헤더/body의 모든 `{{VAR}}` 토큰 보간)
- [ ] `packages/core/src/http/httpClient.ts` 구현 — `executeRequest(request: HttpRequest): Promise<HttpResponse>` (undici로 요청 실행, 상태코드/헤더/body/응답시간 캡처)
- [ ] HTTP 엔진: GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS 7개 메서드 지원
- [ ] HTTP 엔진: 모든 body 타입 지원 — JSON (Content-Type application/json), form-data (URLSearchParams), multipart (FormData), raw (string), none
- [ ] HTTP 엔진: 타임아웃 지원 (`HttpRequest.timeoutMs`, 기본값 30000ms)
- [ ] HTTP 엔진: 리다이렉트 처리 (최대 5회, 설정 가능)
- [ ] requestBuilder Vitest 단위 테스트 — URL/헤더/JSON body 변수 보간, strict 모드 누락 변수, body 타입 전환
- [ ] httpClient Vitest 단위 테스트 (`undici.MockAgent` 사용) — GET 200, POST JSON body, 응답시간 캡처, 비JSON body 문자열 반환, 4xx/5xx HttpResponse 반환 (throw 아님)

### Assertion Engine

- [ ] `packages/core` 패키지에 `ajv`, `ajv-formats` 의존성 추가
- [ ] `packages/core/src/assertions/assertionEvaluator.ts` 구현 — `evaluateAssertions(rules: AssertionRule[], response: HttpResponse): AssertionResult[]`
- [ ] 어서션 규칙: `{ status: number }` — HTTP 상태코드 일치 검사
- [ ] 어서션 규칙: `{ "body.field.path": "exists" }` — dot-notation 경로 존재 확인 (null/undefined 아님)
- [ ] 어서션 규칙: `{ "body.field.path": value }` — dot-notation 경로 값 동등 비교 (깊은 비교)
- [ ] 어서션 규칙: `{ responseTime: { lt: number } }` — 응답시간 ms 비교
- [ ] 어서션 규칙: `{ "body.field.path": { schema: JSONSchema } }` — ajv로 JSON Schema 검증
- [ ] 어서션 규칙: `{ "header.content-type": value }` — 응답 헤더 값 검사 (대소문자 무시)
- [ ] `packages/core/src/assertions/diffReporter.ts` 구현 — `generateFailureDiff(expected: unknown, actual: unknown): FailureDiff` (사람이 읽기 쉬운 diff 문자열 생성)
- [ ] assertion 모듈 Vitest 단위 테스트 — 모든 규칙 타입, 경로 없음, 타입 불일치, Schema 검증 pass/fail, 중첩 dot 경로, 배열 인덱스 경로 (body.items.0.id)

### Variable Extraction Engine

- [ ] `packages/core/src/scenario/extractVariables.ts` 구현 — `extractVariables(response: HttpResponse, extractMap: ExtractMap): EnvMap` (JSON body에서 dot-notation 경로 추출)
- [ ] extractVariables Vitest 단위 테스트 — 성공 추출, 없는 경로는 빈 문자열 (throw 아님), 중첩 경로, 배열 인덱스 경로

### Scenario Runner

- [ ] `packages/core/src/scenario/scenarioRunner.ts` 구현 — `runScenario(scenario: ScenarioFile, index: Map<string, CollectionRequest>, env: EnvMap): Promise<ScenarioResult>`
- [ ] scenario runner: 각 step마다 operationId 해석 (`UnknownOperationError` throw), env + 이전 추출 변수 병합, 요청 빌드 → 실행 → 어서션 → 변수 추출
- [ ] scenario runner: `ScenarioResult` 생성 (step별 `StepResult`, 전체 pass/fail, 총 소요시간, UUID id)
- [ ] `packages/core/src/scenario/parallelRunner.ts` 구현 — `runScenariosInParallel(scenarios: ScenarioFile[], index: Map<string, CollectionRequest>, env: EnvMap, concurrency: number): Promise<ScenarioResult[]>` (수동 promise pool, 외부 라이브러리 없음)
- [ ] scenario runner Vitest 통합 테스트 (`undici.MockAgent`) — 다단계 체인 시나리오, 어서션 실패 기록 후 계속 진행, 추출 후 주입, 알 수 없는 operationId 오류

### Response History

- [ ] `packages/core/src/history/historyStore.ts` 구현 — `saveHistoryEntry(entry: HistoryEntry, historyDir: string): Promise<void>` (`.flint/history/<operationId>/<ISO timestamp>.json`에 저장, 최근 50개 유지)
- [ ] `packages/core/src/history/historyReader.ts` 구현 — `getHistory(operationId: string, historyDir: string, limit?: number): Promise<HistoryEntry[]>` (최신순 반환)
- [ ] `packages/core/src/history/responseComparator.ts` 구현 — `compareResponses(a: HttpResponse, b: HttpResponse): ResponseDiff` (상태코드, 헤더, body 필드 추가/제거/타입변경/값변경 감지)
- [ ] history 모듈 Vitest 단위 테스트 — 저장/읽기 라운드트립, 50개 초과 시 자동 정리, 구조 변화 감지 (필드 추가, 제거, 타입 변경)

### Code Snippet Generator

- [ ] `packages/core/src/snippet/snippetGenerator.ts` 구현 — `generateCodeSnippet(request: HttpRequest, target: SnippetTarget): string`
- [ ] curl 스니펫: 메서드, 헤더, body, URL 쿼리 파라미터 올바르게 생성
- [ ] fetch 스니펫: 네이티브 fetch API (ES2022 형식)
- [ ] axios 스니펫: axios 라이브러리 형식
- [ ] python-requests 스니펫: Python requests 라이브러리 형식
- [ ] go-http 스니펫: Go net/http 패키지 형식
- [ ] httpie 스니펫: HTTPie CLI 형식
- [ ] snippet 모듈 Vitest 단위 테스트 — 각 타겟별 GET/POST + JSON body, 쿼리 파라미터 인코딩, 특수문자 이스케이프

### Auth Manager

- [ ] `packages/core/src/auth/authResolver.ts` 구현 — `resolveAuth(profile: AuthProfile, vars: EnvMap): Promise<RequestHeaders>` (프로파일 타입에 따라 Authorization 헤더 생성)
- [ ] `packages/core/src/auth/jwtHandler.ts` 구현 — `isJwtExpired(token: string): boolean`, `refreshJwt(config: JwtConfig, vars: EnvMap): Promise<string>` (refresh_token으로 갱신)
- [ ] `packages/core/src/auth/oauth2Handler.ts` 구현 — `startOAuth2Flow(config: OAuth2Config): Promise<string>` (Authorization Code Flow, PKCE 지원, redirect_uri 로컬 서버 수신)
- [ ] `packages/core/src/auth/authProfileParser.ts` 구현 — `parseAuthProfile(filePath: string): AuthProfile` (YAML 파싱, vault 암호화 값 자동 복호화)
- [ ] auth 모듈 Vitest 단위 테스트 — JWT 만료 감지, Basic Auth 헤더 생성, API Key 헤더/쿼리 방식, Bearer 토큰

### GraphQL Engine

- [ ] `packages/core/src/graphql/graphqlClient.ts` 구현 — `executeGraphQL(endpoint: string, request: GraphQLRequest, headers: RequestHeaders): Promise<GraphQLResponse>` (POST /graphql, application/json, variables 지원)
- [ ] `packages/core/src/graphql/introspectionClient.ts` 구현 — `fetchSchema(endpoint: string, headers: RequestHeaders): Promise<GraphQLSchema>` (introspection query 자동 실행)
- [ ] `packages/core/src/graphql/graphqlParser.ts` 구현 — `parseGraphQLCollection(content: string): GraphQLRequest` (x-flint protocol: graphql 컬렉션 파일 파싱)
- [ ] graphql 모듈 Vitest 단위 테스트 (`undici.MockAgent`) — Query 실행, Mutation 실행, variables 주입, 에러 응답 처리

### WebSocket / SSE Engine

- [ ] `packages/core/src/realtime/webSocketRunner.ts` 구현 — `runWebSocketScenario(scenario: WebSocketScenario, vars: EnvMap): Promise<StepResult[]>` (연결 → send → receive 어서션 → 종료)
- [ ] `packages/core/src/realtime/sseRunner.ts` 구현 — `runSseScenario(scenario: SseScenario, vars: EnvMap): Promise<StepResult[]>` (스트림 연결, 이벤트 수신, 타임아웃 처리)
- [ ] realtime 모듈 Vitest 단위 테스트 — WebSocket 메시지 송수신, SSE 이벤트 수신, 타임아웃 처리

### Performance Test Engine

- [ ] `packages/core/src/benchmark/benchmarkRunner.ts` 구현 — `runBenchmark(scenario: ScenarioFile, index: Map<string, CollectionRequest>, env: EnvMap, options: BenchmarkOptions): Promise<BenchmarkResult>`
- [ ] BenchmarkOptions: `concurrent` (동시 요청 수), `duration` (초), `rampUpSeconds` (워밍업), `maxRequests` (요청 총 수 상한)
- [ ] BenchmarkResult: `totalRequests`, `successRate`, `errorRate`, `rps`, `latencyHistogram` (p50/p75/p90/p95/p99/min/max/mean)
- [ ] benchmark 모듈 Vitest 단위 테스트 — concurrency 동작, 시간 기반 종료, ramp-up, 통계 정확성 (mock 응답 사용)

### Mock Server Engine

- [ ] `packages/core/src/mock/mockRequestMatcher.ts` 구현 — `matchRequest(request: IncomingRequest, collections: CollectionRequest[]): CollectionRequest | null` (method + path 매칭, path 파라미터 추출)
- [ ] `packages/core/src/mock/mockResponseGenerator.ts` 구현 — `generateMockResponse(collection: CollectionRequest, pathParams: Record<string, string>): MockResponse` (example 필드 기반 응답 생성, x-flint-mock delay 지원)
- [ ] `packages/core/src/mock/mockServer.ts` 구현 — `createMockServer(collections: CollectionRequest[]): MockServerHandle` (pure logic, 포트 바인딩 없음 — CLI/app이 담당)
- [ ] mock 모듈 Vitest 단위 테스트 — path 매칭, 파라미터 추출, example 응답, delay 시뮬레이션, 매칭 안되는 경로 404

### Diff Run (두 환경 비교)

- [ ] `packages/core/src/diff-run/diffScenarioRunner.ts` 구현 — `runDiffScenario(scenario: ScenarioFile, index: Map<string, CollectionRequest>, envA: EnvMap, envB: EnvMap): Promise<DiffRunResult>` (두 환경 동시 실행)
- [ ] DiffRunResult: 각 step별 두 환경의 응답 비교 (`ResponseComparison[]`), 전체 diff 요약
- [ ] diff-run 모듈 Vitest 단위 테스트 — 동일 응답 (no diff), 상태코드 차이, body 구조 차이, 헤더 차이

### Documentation Generator

- [ ] `packages/core/src/docs/markdownGenerator.ts` 구현 — `generateMarkdown(collections: CollectionRequest[], options: DocumentationOptions): string` (요청별 설명/예시/어서션 포함)
- [ ] `packages/core/src/docs/htmlGenerator.ts` 구현 — `generateHtml(collections: CollectionRequest[], options: DocumentationOptions): string` (Bootstrap 기반 단일 HTML 파일)
- [ ] DocumentationOptions: `includeExamples` (실제 실행 결과 포함), `includeAssertions`, `includeSchemas`, `title`
- [ ] docs 모듈 Vitest 단위 테스트 — Markdown 출력 형식 검증, HTML 유효성 검사, 빈 컬렉션 처리

### OpenAPI Import/Export

- [ ] `packages/core/src/openapi/openapiImporter.ts` 구현 — `importFromOpenAPI(spec: OpenAPIV3.Document): CollectionRequest[]` (각 path+method 조합을 CollectionRequest로 변환, operationId 없으면 `METHOD-path` 생성)
- [ ] `packages/core/src/openapi/swagger2Importer.ts` 구현 — `importFromSwagger2(spec: OpenAPIV2.Document): CollectionRequest[]` (Swagger 2.x → OpenAPI 3.x 스키마 내부 변환)
- [ ] `packages/core/src/openapi/postmanImporter.ts` 구현 — `importFromPostmanV21(collection: PostmanV21Collection): CollectionRequest[]` (최소 PostmanV21Collection 타입 인라인 정의)
- [ ] `packages/core/src/openapi/openapiExporter.ts` 구현 — `exportToOpenAPI(requests: CollectionRequest[]): OpenAPIV3.Document` (모든 요청을 하나의 OpenAPI 문서로 병합)
- [ ] importer/exporter Vitest 단위 테스트 — 라운드트립 테스트, 누락된 operationId 생성, Swagger 2.x 타입 변환

### OpenAPI Validator

- [ ] `packages/core` 패키지에 `@apidevtools/swagger-parser` 의존성 추가
- [ ] `packages/core/src/openapi/openapiValidator.ts` 구현 — `validateCollectionFile(filePath: string): ValidationResult` (`ValidationResult = { valid: boolean; errors: ValidationError[] }`)
- [ ] validator Vitest 단위 테스트 — 유효한 파일 통과, 필수 필드 누락 오류, x-flint 확장 필드로 인한 false negative 없음

### Scenario Auto-Generator

- [ ] `packages/core/src/openapi/scenarioGenerator.ts` 구현 — `generateScenarioFromOpenAPI(spec: OpenAPIV3.Document): ScenarioFile` (POST /resource → GET /resource/{id} 의존성 순서, login-like 오퍼레이션 우선 배치)
- [ ] scenario generator Vitest 단위 테스트 — 단일 오퍼레이션, CRUD 의존성 순서, login-first 휴리스틱

### Git Integration

- [ ] `packages/core/src/git/commitAnalyzer.ts` 구현 — `analyzeCommit(commitMessage: string, scenariosDir: string): string[]` (커밋 메시지 토큰화, 시나리오 파일명 및 operationId 참조 매칭, 실행할 시나리오 경로 목록 반환)
- [ ] commitAnalyzer Vitest 단위 테스트 — 직접 파일명 매칭, operationId 토큰 매칭, 매칭 없음은 빈 배열

### Public API Surface

- [ ] `packages/core/src/index.ts` 생성 — 공개 API 전체 export:
  - types/index.ts의 모든 타입
  - env 모듈: `loadEnvFile`, `resolveEnvChain`, `interpolate`
  - vault 모듈: `encryptEnvFile`, `decryptEnvFile`
  - collection 모듈: `parseCollectionFile`, `parseCollectionContent`, `buildCollectionIndex`
  - scenario 모듈: `parseScenarioFile`, `runScenario`, `runScenariosInParallel`
  - http 모듈: `buildRequest`, `executeRequest`
  - assertions 모듈: `evaluateAssertions`, `generateFailureDiff`
  - extraction 모듈: `extractVariables`
  - history 모듈: `saveHistoryEntry`, `getHistory`, `compareResponses`
  - snippet 모듈: `generateCodeSnippet`
  - auth 모듈: `resolveAuth`, `isJwtExpired`, `parseAuthProfile`
  - graphql 모듈: `executeGraphQL`, `fetchSchema`
  - realtime 모듈: `runWebSocketScenario`, `runSseScenario`
  - benchmark 모듈: `runBenchmark`
  - mock 모듈: `createMockServer`
  - diff-run 모듈: `runDiffScenario`
  - docs 모듈: `generateMarkdown`, `generateHtml`
  - openapi 모듈: `importFromOpenAPI`, `importFromSwagger2`, `importFromPostmanV21`, `exportToOpenAPI`, `validateCollectionFile`, `generateScenarioFromOpenAPI`
  - git 모듈: `analyzeCommit`
- [ ] `pnpm --filter @flint/core build` 실행 — TypeScript 에러 0개 확인
- [ ] `pnpm --filter @flint/core test` 실행 — 모든 테스트 통과, 커버리지 80% 이상 확인

---

## cli

### 스캐폴드

- [ ] `packages/cli/package.json`에 의존성 추가: `@flint/core`, `commander`, `chalk`, `chokidar`, `js-yaml`, `execa` (통합 테스트용 devDep), `ora` (스피너)
- [ ] `packages/cli/src/index.ts` 생성 — commander 루트 프로그램, 모든 서브커맨드 등록, `program.parseAsync(process.argv)` 호출
- [ ] `packages/cli/src/commands/` 디렉토리 구조 생성

### `flint run`

- [ ] `packages/cli/src/commands/run.ts` 구현 — `flint run <scenario> [--env <name>] [--reporter <format>] [--collections <dir>] [--compare <envA> <envB>]`
- [ ] run 커맨드: 시나리오 파일 경로 해석, `./collections` (또는 `--collections` 플래그)에서 collection index 빌드, `./environments`에서 env chain 해석 (기본값: base), `runScenario` 또는 `runScenariosInParallel` 호출
- [ ] run 커맨드: `--compare envA envB` 플래그 시 `runDiffScenario` 호출 후 diff reporter로 출력
- [ ] run 커맨드: ScenarioResult를 선택된 reporter로 출력, exit code 0 (전체 통과) 또는 1 (실패 있음)

### `flint watch`

- [ ] `packages/cli/src/commands/watch.ts` 구현 — `chokidar`로 `./scenarios/**/*.yaml`, `./collections/**/*.yaml` 감시, 변경 시 영향받는 시나리오 재실행, 300ms debounce

### `flint validate`

- [ ] `packages/cli/src/commands/validate.ts` 구현 — glob 또는 디렉토리 경로, 각 파일마다 `validateCollectionFile` 호출, 파일별 오류 출력, 전체 유효하면 0 아니면 1

### `flint import`

- [ ] `packages/cli/src/commands/import.ts` 구현 — 파일 형식 자동 감지 (openapi/swagger/info.schema 필드 검사), 적절한 importer 호출, CollectionRequest 1개당 `./collections/<operationId>.yaml` 파일 1개 작성

### `flint export`

- [ ] `packages/cli/src/commands/export.ts` 구현 — `--format openapi` (기본값), `./collections/`의 모든 파일 읽기, `exportToOpenAPI` 호출, `openapi.yaml` 작성

### `flint bench`

- [ ] `packages/cli/src/commands/bench.ts` 구현 — `flint bench <scenario> [--concurrent <n>] [--duration <s>] [--ramp-up <s>] [--reporter pretty|json|html]`
- [ ] bench 커맨드: `runBenchmark` 호출, 결과를 터미널 차트(pretty) 또는 JSON 또는 HTML로 출력

### `flint mock`

- [ ] `packages/cli/src/commands/mock.ts` 구현 — `flint mock [--port <n>] [--collection <dir>]` (기본 포트 4000)
- [ ] mock 커맨드: `createMockServer` 호출 후 지정 포트에 HTTP 서버 바인딩, Ctrl+C 시 정상 종료

### `flint vault`

- [ ] `packages/cli/src/commands/vault.ts` 구현 — `flint vault encrypt <env-file>`, `flint vault decrypt <vault-file>`
- [ ] vault 커맨드: `--vault-key` 플래그 또는 `FLINT_VAULT_KEY` 환경변수에서 키 읽기

### `flint docs`

- [ ] `packages/cli/src/commands/docs.ts` 구현 — `flint docs [--output <dir>] [--format markdown|html] [--include-examples] [--collection <dir>]`
- [ ] docs 커맨드: collection index 빌드 후 `generateMarkdown` 또는 `generateHtml` 호출, 지정 디렉토리에 파일 작성

### `flint hook`

- [ ] `packages/cli/src/commands/hookInstall.ts` 구현 — `flint hook install` (`.git/hooks/pre-commit` 셸 스크립트 작성, 이미 존재하면 오버라이드 여부 확인), `flint hook remove` (pre-commit hook 제거)

### Reporters

- [ ] `packages/cli/src/reporters/prettyReporter.ts` 구현 — ANSI 컬러 출력: step 이름, 통과/실패 아이콘, 응답시간, 실패 시 assertion diff
- [ ] `packages/cli/src/reporters/jsonReporter.ts` 구현 — ScenarioResult를 JSON으로 stdout 출력 (CI용)
- [ ] `packages/cli/src/reporters/junitReporter.ts` 구현 — JUnit XML 형식 (`<testsuite>/<testcase>`, GitHub Actions/Jenkins 호환)
- [ ] `packages/cli/src/reporters/githubActionsReporter.ts` 구현 — GitHub Actions workflow 커맨드 (`::error file=...::`, `::warning::`) PR 인라인 어노테이션
- [ ] `packages/cli/src/reporters/diffReporter.ts` 구현 — DiffRunResult 컬러 diff 출력 (두 환경 비교용)
- [ ] `packages/cli/src/reporters/benchReporter.ts` 구현 — BenchmarkResult 터미널 histogram 차트 (pretty), JSON, HTML 지원
- [ ] `packages/cli/src/reporters/index.ts` 생성 — `getReporter(format: string): Reporter` 팩토리, `Reporter` 인터페이스: `report(result: ScenarioResult | BenchmarkResult | DiffRunResult): void`

### CLI 통합 테스트

- [ ] `packages/cli/tests/fixtures/` 디렉토리에 테스트용 collections, scenarios, environments 픽스처 생성
- [ ] `packages/cli/tests/run.test.ts` 구현 — `execa`로 `flint run` 실행, 픽스처 시나리오 + mock 서버, exit code 0 (통과) / 1 (어서션 실패) 확인
- [ ] `packages/cli/tests/validate.test.ts` 구현 — 유효한 컬렉션 exit 0, 잘못된 컬렉션 exit 1 확인
- [ ] `packages/cli/tests/import.test.ts` 구현 — 픽스처 OpenAPI 파일 import 후 temp 디렉토리에 예상 YAML 파일 생성 확인
- [ ] `packages/cli/tests/reporter-json.test.ts` 구현 — `--reporter json` stdout이 유효한 JSON이고 ScenarioResult 형태 확인

### 빌드

- [ ] `pnpm --filter @flint/cli build` 실행 — TypeScript 에러 0개 확인
- [ ] `pnpm --filter @flint/cli test` 실행 — 통합 테스트 전체 통과 확인

---

## mcp

### 스캐폴드

- [ ] `packages/mcp/package.json`에 의존성 추가: `@flint/core`, `@modelcontextprotocol/sdk`, `express`
- [ ] `packages/mcp/src/index.ts` 생성 — `startMcpServer(port: number, workspaceRoot: string): Promise<McpServerHandle>` export (`McpServerHandle = { stop(): Promise<void> }`)
- [ ] MCP 서버 내부 결과 저장소 구현 — bounded in-memory LRU store (최대 100개), UUID로 ScenarioResult 인덱싱

### MCP 툴 구현

- [ ] `packages/mcp/src/tools/runScenario.ts` 구현 — MCP 툴 `run_scenario(scenarioPath: string, env?: string)`: workspaceRoot 기준 시나리오 파일 로드, collection index 빌드, base env 해석, `runScenario` 호출, ScenarioResult JSON 반환
- [ ] `packages/mcp/src/tools/getCollections.ts` 구현 — MCP 툴 `get_collections()`: `{workspaceRoot}/collections/` 재귀 탐색, `{ operationId, path, method, title }[]` 배열 반환
- [ ] `packages/mcp/src/tools/createRequest.ts` 구현 — MCP 툴 `create_request(spec: CollectionRequest)`: 스펙 검증, `{workspaceRoot}/collections/{operationId}.yaml`에 YAML 파일 작성, 파일 경로 반환
- [ ] `packages/mcp/src/tools/getLastResult.ts` 구현 — MCP 툴 `get_last_result()`: LRU store에서 가장 최근 ScenarioResult 반환 (없으면 null)
- [ ] `packages/mcp/src/tools/generateScenarioFromOpenAPI.ts` 구현 — MCP 툴 `generate_scenario_from_openapi(spec: string)`: OpenAPI 스펙 문자열(JSON 또는 YAML) 파싱, `generateScenarioFromOpenAPI` 호출, 결과 ScenarioFile YAML 문자열 반환
- [ ] `packages/mcp/src/tools/analyzeFailure.ts` 구현 — MCP 툴 `analyze_failure(resultId: string)`: LRU store에서 ScenarioResult 조회, 실패 맥락(실패 step, assertion diff, 요청/응답 상세) 구조화된 문자열 반환 (LLM에게 넘길 형태, 직접 LLM 호출 없음)
- [ ] `packages/mcp/src/tools/mockServerStart.ts` 구현 — MCP 툴 `mock_server_start(port?: number)`: workspaceRoot의 collections 로드, `createMockServer` 호출, 지정 포트에 바인딩, 서버 URL 반환
- [ ] `packages/mcp/src/tools/mockServerStop.ts` 구현 — MCP 툴 `mock_server_stop()`: 실행 중인 mock 서버 정상 종료
- [ ] `packages/mcp/src/tools/runBench.ts` 구현 — MCP 툴 `run_bench(scenarioPath: string, options?: BenchmarkOptions)`: `runBenchmark` 호출, BenchmarkResult JSON 반환
- [ ] `packages/mcp/src/tools/getHistory.ts` 구현 — MCP 툴 `get_history(operationId: string, limit?: number)`: `getHistory` 호출, HistoryEntry 배열 반환
- [ ] `packages/mcp/src/tools/generateDocs.ts` 구현 — MCP 툴 `generate_docs(format?: "markdown"|"html", outputDir?: string)`: workspaceRoot collections 로드, 문서 생성, 파일 작성 후 파일 경로 반환

### MCP 서버 트랜스포트

- [ ] `packages/mcp/src/server.ts` 구현 — MCP SDK 서버 인스턴스 생성, 11개 툴 전체 등록
- [ ] SSE 트랜스포트: `GET /sse` (MCP 클라이언트 연결), `POST /message` (툴 호출) 엔드포인트 구현
- [ ] 헬스체크 엔드포인트: `GET /health` → `{ status: "ok", version: "1.0.0" }`

### MCP 테스트

- [ ] 각 툴별 단위 테스트 (mock workspaceRoot + 픽스처 데이터 사용)
- [ ] 통합 테스트: 랜덤 포트에서 서버 시작, MCP 클라이언트 연결, `get_collections` 호출, 응답 형태 확인

### 빌드

- [ ] `pnpm --filter @flint/mcp build` 실행 — TypeScript 에러 0개 확인
- [ ] `pnpm --filter @flint/mcp test` 실행 — 테스트 전체 통과 확인

---

## app

### 스캐폴드

- [ ] `packages/app/package.json`에 의존성 추가: `@flint/core`, `@flint/mcp`, `electron`, `vite`, `vite-plugin-electron`, `react`, `react-dom`, `@types/react`, `codemirror` (또는 `@monaco-editor/react`), `electron-builder`
- [ ] `packages/app/src/main/index.ts` 생성 — Electron 메인 프로세스 진입점: `BrowserWindow` 생성, `startMcpServer(3141, workspaceRoot)` 호출, `app.on('quit')` 시 MCP 서버 정상 종료
- [ ] `packages/app/src/preload/index.ts` 생성 — `contextBridge.exposeInMainWorld('flint', { invoke })` 단일 전역 노출
- [ ] `packages/app/src/renderer/index.html`, `packages/app/src/renderer/main.tsx` 생성 — 렌더러 진입점
- [ ] `packages/app/vite.config.ts` 생성 — `vite-plugin-electron` 설정, main/preload/renderer 빌드 타겟 분리

### IPC 브릿지

- [ ] `packages/app/src/shared/ipc.ts` 구현 — IpcRequest, IpcResponse 식별 유니언 타입 전체 정의 (기존 7개 + 신규 기능 포함: execute-graphql, run-websocket, run-sse, run-bench, start-mock, stop-mock, get-history, generate-docs, encrypt-vault, decrypt-vault, generate-snippet, get-auth-profiles, run-diff-scenario)
- [ ] `packages/app/src/main/ipcHandlers.ts` 구현 — 모든 채널에 대한 `ipcMain.handle` 등록, `@flint/core` 함수에 위임
- [ ] `packages/app/src/preload/index.ts` 구현 — IpcRequest/IpcResponse 타입에 맞는 typed wrappers를 `ipcRenderer.invoke`로 구현

### Renderer UI — 기본 패널

- [ ] `RequestEditor` 컴포넌트: 메서드 선택기, URL 입력 (변수 보간 미리보기), Headers/Query Params/Body 탭
- [ ] `BodyEditor` 컴포넌트: body 타입 스위처 (none/JSON/form-data/multipart/raw), JSON 에디터 (syntax highlighting)
- [ ] `ResponseViewer` 컴포넌트: 상태코드 배지 (컬러코딩), 응답시간, 응답 헤더 accordion, body JSON syntax highlighting, 복사 버튼
- [ ] `CollectionTree` 컴포넌트: `./collections/` 파일시스템 트리 뷰, 클릭 시 RequestEditor 로드
- [ ] `CollectionSearch` 컴포넌트: operationId/title 퍼지 검색
- [ ] `ScenarioList` 컴포넌트: `./scenarios/*.yaml` 목록, 시나리오별 실행 버튼
- [ ] `ScenarioResultView` 컴포넌트: step별 pass/fail 아이콘, assertion 상세, 추출 변수 표시, 실패 diff (빨간색 강조)
- [ ] `EnvironmentSelector` 컴포넌트: 사용 가능한 env 드롭다운, 현재 활성 env 표시
- [ ] `EnvVarTable` 컴포넌트: 선택된 env의 해석된 변수 읽기 전용 표시 (SECRET/PASSWORD/TOKEN/KEY 포함 키는 마스킹, "reveal" 클릭 시만 표시)

### Renderer UI — 추가 기능 패널

- [ ] `CodeSnippetPanel` 컴포넌트: 현재 요청의 코드 스니펫, 타겟 언어 드롭다운 (curl/fetch/axios/python/go/httpie), 클립보드 복사 버튼
- [ ] `HistoryPanel` 컴포넌트: operationId별 이전 응답 목록, 선택 시 현재 응답과 side-by-side diff 뷰, 구조 변화 경고 표시
- [ ] `AuthManagerPanel` 컴포넌트: 인증 프로파일 목록 (CRUD), OAuth2 flow 시작 버튼, JWT 토큰 상태 표시 (만료 여부)
- [ ] `GraphQLEditor` 컴포넌트: Query/Mutation/Subscription 입력 에디터 (syntax highlighting), variables JSON 입력, 스키마 탐색 사이드바, 실행 버튼
- [ ] `WebSocketPanel` 컴포넌트: 연결 URL 입력, 연결/해제 버튼, 메시지 송신 입력, 실시간 메시지 로그 (시간순), 연결 상태 표시
- [ ] `BenchmarkPanel` 컴포넌트: concurrent/duration/ramp-up 설정, 실행 버튼, 실시간 RPS/latency 차트, 완료 후 통계 요약
- [ ] `DocViewer` 컴포넌트: 생성된 API 문서 미리보기 (Markdown 렌더링), Markdown/HTML 내보내기 버튼

### App State

- [ ] `packages/app/src/renderer/store/appStore.ts` 구현 — Zustand 또는 React Context 기반 전역 상태: 현재 workspaceRoot, 활성 environment, 열린 요청, 히스토리, 인증 프로파일 목록

### Electron E2E 테스트 (Playwright)

- [ ] Playwright 테스트: 앱 실행 후 메인 윈도우 표시 (스크린샷 어서션)
- [ ] Playwright 테스트: `https://httpbin.org/get`으로 GET 요청 전송, 응답 뷰어에 상태코드 200 표시 확인
- [ ] Playwright 테스트: 픽스처 collections 디렉토리에서 collection tree 정상 표시 확인
- [ ] Playwright 테스트: 앱 실행 후 `http://localhost:3141/health`에서 MCP 서버 정상 응답 확인

### 빌드 & 패키지

- [ ] `electron-builder` 설정: mac/win/linux 타겟, `appId: com.flint.app`, 아이콘 설정
- [ ] `pnpm --filter @flint/app build` 실행 — TypeScript 에러 0개 확인 (main + renderer + preload)
- [ ] `pnpm --filter @flint/app test:e2e` 실행 — Playwright 테스트 전체 통과 확인

---

## cross-cutting

- [ ] `packages/core/src/git/commitAnalyzer.ts` — 앞서 core 섹션에서 완료
- [ ] `packages/cli/src/commands/hookInstall.ts` — 앞서 cli 섹션에서 완료
- [ ] `.github/workflows/flint-ci.yml` 예시 파일 생성 — `flint run **/*.yaml --reporter github-actions` 스텝 포함 GitHub Actions 워크플로우 예시
- [ ] `README.md` 작성 — 프로젝트 설명, 설치 (`pnpm install`, `pnpm build`), CLI 사용법 전체, MCP 설정 예시 (`.claude/mcp.json`), 파일 포맷 예시, 기여 가이드 링크

---

## 전체 완료 기준

- [ ] `pnpm -r build` — 에러 없이 전체 빌드 성공
- [ ] `pnpm -r test` — 모든 단위/통합 테스트 통과
- [ ] `pnpm -r lint` — ESLint 에러 0개
- [ ] `pnpm -r typecheck` — TypeScript strict 컴파일 에러 0개
- [ ] `flint run` E2E — 예시 시나리오 실행 후 exit 0
- [ ] MCP 서버 — `http://localhost:3141/health` 200 응답
- [ ] Electron 앱 — 실행 후 UI 정상 표시, MCP 서버 자동 시작 확인
