// Types
export * from './types/index.js';

// env module
export { loadEnvFile, parseEnvContent } from './env/envLoader.js';
export { resolveEnvChain } from './env/envResolver.js';
export { interpolate, InterpolationError } from './env/variableInterpolator.js';

// vault module
export { encryptEnvFile, writeVaultFile, VaultError } from './vault/vaultEncryptor.js';
export { decryptEnvFile, decryptVault } from './vault/vaultDecryptor.js';
export { deriveKey } from './vault/vaultKeyDerivation.js';

// collection module
export {
  parseCollectionFile,
  parseCollectionContent,
  CollectionParseError,
  DuplicateOperationIdError,
} from './collection/collectionParser.js';
export { buildCollectionIndex } from './collection/collectionIndex.js';

// scenario module
export {
  parseScenarioFile,
  parseScenarioContent,
  ScenarioParseError,
} from './scenario/scenarioParser.js';
export {
  runScenario,
  UnknownOperationError,
} from './scenario/scenarioRunner.js';
export { runScenariosInParallel } from './scenario/parallelRunner.js';
export { extractVariables } from './scenario/extractVariables.js';

// http module
export { buildRequest } from './http/requestBuilder.js';
export { executeRequest } from './http/httpClient.js';

// assertions module
export { evaluateAssertions } from './assertions/assertionEvaluator.js';
export { generateFailureDiff } from './assertions/diffReporter.js';

// history module
export { saveHistoryEntry } from './history/historyStore.js';
export { getHistory } from './history/historyReader.js';
export { compareResponses } from './history/responseComparator.js';

// snippet module
export { generateCodeSnippet } from './snippet/snippetGenerator.js';

// auth module
export { resolveAuth } from './auth/authResolver.js';
export { isJwtExpired, refreshJwt } from './auth/jwtHandler.js';
export { startOAuth2Flow } from './auth/oauth2Handler.js';
export { parseAuthProfile } from './auth/authProfileParser.js';

// graphql module
export { executeGraphQL } from './graphql/graphqlClient.js';
export { fetchSchema } from './graphql/introspectionClient.js';
export { parseGraphQLCollection } from './graphql/graphqlParser.js';

// realtime module
export { runWebSocketScenario } from './realtime/webSocketRunner.js';
export { runSseScenario } from './realtime/sseRunner.js';

// benchmark module
export { runBenchmark } from './benchmark/benchmarkRunner.js';

// mock module
export { createMockServer } from './mock/mockServer.js';
export { matchRequest } from './mock/mockRequestMatcher.js';
export { generateMockResponse } from './mock/mockResponseGenerator.js';

// diff-run module
export { runDiffScenario } from './diff-run/diffScenarioRunner.js';

// docs module
export { generateMarkdown } from './docs/markdownGenerator.js';
export { generateHtml } from './docs/htmlGenerator.js';

// openapi module
export { importFromOpenAPI } from './openapi/openapiImporter.js';
export { importFromSwagger2 } from './openapi/swagger2Importer.js';
export { importFromPostmanV21 } from './openapi/postmanImporter.js';
export type { PostmanV21Collection } from './openapi/postmanImporter.js';
export { exportToOpenAPI } from './openapi/openapiExporter.js';
export { validateCollectionFile } from './openapi/openapiValidator.js';
export { generateScenarioFromOpenAPI } from './openapi/scenarioGenerator.js';

// git module
export { analyzeCommit } from './git/commitAnalyzer.js';
