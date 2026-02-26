import type { CollectionRequest, MockResponse } from '../types/index.js';

export function generateMockResponse(
  collection: CollectionRequest,
  pathParams: Record<string, string>,
  method?: string,
): MockResponse {
  // Find the operation
  for (const [, methods] of Object.entries(collection.paths)) {
    for (const [m, operation] of Object.entries(methods)) {
      if (method && m !== method.toLowerCase()) continue;

      const op = operation as Record<string, unknown>;
      const xFlint = op['x-flint'] as Record<string, unknown> | undefined;
      const mockConfig = xFlint?.['mock'] as { delay?: number; statusCode?: number } | undefined;

      const delay = mockConfig?.delay ?? 0;
      const statusCode = mockConfig?.statusCode ?? 200;

      // Extract example from responses
      const responses = op['responses'] as Record<string, unknown> | undefined;
      const successResponse = responses?.['200'] ?? responses?.['201'] ?? responses?.[Object.keys(responses ?? {})[0]];

      let body: unknown = null;
      let headers: Record<string, string> = { 'content-type': 'application/json' };

      if (successResponse && typeof successResponse === 'object') {
        const resp = successResponse as Record<string, unknown>;
        const content = resp['content'] as Record<string, unknown> | undefined;

        if (content?.['application/json']) {
          const jsonContent = content['application/json'] as Record<string, unknown>;
          body = jsonContent['example'] ??
            (jsonContent['schema'] as Record<string, unknown> | undefined)?.['example'] ??
            {};
        }
      }

      // Replace path params in body
      if (body && typeof body === 'object') {
        body = JSON.parse(
          JSON.stringify(body).replace(
            /\{([^}]+)\}/g,
            (_, key: string) => pathParams[key] ?? `{${key}}`,
          ),
        );
      }

      return { status: statusCode, headers, body, delay };
    }
  }

  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: {},
    delay: 0,
  };
}
