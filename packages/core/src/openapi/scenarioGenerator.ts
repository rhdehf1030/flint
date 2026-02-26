import type { OpenAPIV3 } from 'openapi-types';

import type { ScenarioFile, ScenarioStep } from '../types/index.js';

const LOGIN_PATTERNS = /login|auth|signin|token|session/i;

export function generateScenarioFromOpenAPI(spec: OpenAPIV3.Document): ScenarioFile {
  const steps: ScenarioStep[] = [];

  const operations: Array<{
    operationId: string;
    method: string;
    path: string;
    isLogin: boolean;
    isPost: boolean;
    isGet: boolean;
  }> = [];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation) continue;

      const operationId =
        operation.operationId ??
        `${method.toUpperCase()}-${path.replace(/\//g, '-').replace(/^-/, '')}`;

      operations.push({
        operationId,
        method,
        path,
        isLogin: LOGIN_PATTERNS.test(operationId) || LOGIN_PATTERNS.test(path),
        isPost: method === 'post',
        isGet: method === 'get',
      });
    }
  }

  // Sort: login-like first, then POST (create), then GET (read), then others
  operations.sort((a, b) => {
    if (a.isLogin && !b.isLogin) return -1;
    if (!a.isLogin && b.isLogin) return 1;
    if (a.isPost && !b.isPost) return -1;
    if (!a.isPost && b.isPost) return 1;
    if (a.isGet && !b.isGet) return 1;
    if (!a.isGet && b.isGet) return -1;
    return 0;
  });

  for (const op of operations) {
    const step: ScenarioStep = { operationId: op.operationId };

    // Auto-extract token from login-like operations
    if (op.isLogin) {
      step.extract = { ACCESS_TOKEN: 'body.access_token' };
    }

    steps.push(step);
  }

  return {
    'x-flint-scenario': {
      name: `${spec.info?.title ?? 'API'} — Generated Scenario`,
      version: '1.0',
      steps,
    },
  };
}
