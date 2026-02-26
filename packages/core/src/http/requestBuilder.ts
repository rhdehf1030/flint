import type { CollectionRequest, EnvMap, HttpRequest, HttpMethod, RequestBody } from '../types/index.js';
import { interpolate } from '../env/variableInterpolator.js';

export class RequestBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestBuildError';
  }
}

function interpolateHeaders(
  headers: Record<string, string>,
  vars: EnvMap,
  strict: boolean,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    result[k] = interpolate(v, vars, strict);
  }
  return result;
}

function interpolateBody(body: unknown, vars: EnvMap, strict: boolean): unknown {
  if (typeof body === 'string') {
    return interpolate(body, vars, strict);
  }
  if (Array.isArray(body)) {
    return body.map((item) => interpolateBody(item, vars, strict));
  }
  if (typeof body === 'object' && body !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      result[k] = interpolateBody(v, vars, strict);
    }
    return result;
  }
  return body;
}

/**
 * Build an HttpRequest from a CollectionRequest, substituting {{VAR}} tokens.
 */
export function buildRequest(
  collection: CollectionRequest,
  vars: EnvMap,
  overrides?: Partial<HttpRequest>,
): HttpRequest {
  // Extract the single operation from the collection
  const pathEntries = Object.entries(collection.paths);
  if (pathEntries.length === 0) {
    throw new RequestBuildError('Collection has no paths defined');
  }

  const [pathTemplate, methods] = pathEntries[0];
  const methodEntries = Object.entries(methods);
  if (methodEntries.length === 0) {
    throw new RequestBuildError('Collection path has no methods defined');
  }

  const [methodStr, operation] = methodEntries[0];
  const op = operation as Record<string, unknown>;

  // Determine base URL
  const xFlint = op['x-flint'] as { baseUrl?: string } | undefined;
  const baseUrl = xFlint?.baseUrl ?? collection.servers?.[0]?.url ?? '';

  // Build the full URL
  const interpolatedPath = interpolate(pathTemplate, vars, false);
  const rawUrl = `${baseUrl}${interpolatedPath}`;
  const url = interpolate(rawUrl, vars, overrides?.url === undefined ? false : false);

  // Build headers from operation parameters
  const collectionHeaders: Record<string, string> = {};
  const params = (op['parameters'] as Array<Record<string, unknown>> | undefined) ?? [];
  for (const param of params) {
    if (param['in'] === 'header' && typeof param['name'] === 'string') {
      const example =
        param['example'] ??
        (param['schema']
          ? (param['schema'] as Record<string, unknown>)?.['example']
          : undefined);
      if (typeof example === 'string') {
        collectionHeaders[param['name'] as string] = example;
      }
    }
  }

  const mergedHeaders = interpolateHeaders({ ...collectionHeaders }, vars, false);

  // Build query params from operation parameters
  const queryParams: Record<string, string | string[]> = {};
  for (const param of params) {
    if (param['in'] === 'query' && typeof param['name'] === 'string') {
      const example = param['example'];
      if (typeof example === 'string') {
        queryParams[param['name'] as string] = interpolate(example, vars, false);
      }
    }
  }

  // Build request body
  const requestBodySpec = op['requestBody'] as Record<string, unknown> | undefined;
  let body: RequestBody = { type: 'none' };

  if (requestBodySpec) {
    const content = requestBodySpec['content'] as Record<string, unknown> | undefined;
    if (content?.['application/json']) {
      const jsonContent = content['application/json'] as Record<string, unknown>;
      const example = (jsonContent['example'] as unknown) ??
        ((jsonContent['schema'] as Record<string, unknown> | undefined)?.['example']);
      body = {
        type: 'json',
        json: example !== undefined ? interpolateBody(example, vars, false) : undefined,
      };
      mergedHeaders['content-type'] = 'application/json';
    } else if (content?.['application/x-www-form-urlencoded']) {
      body = { type: 'form-data' };
    } else if (content?.['multipart/form-data']) {
      body = { type: 'multipart' };
    }
  }

  const request: HttpRequest = {
    method: methodStr.toUpperCase() as HttpMethod,
    url,
    headers: mergedHeaders,
    queryParams,
    body,
    timeoutMs: 30000,
    followRedirects: true,
    ...overrides,
  };

  return request;
}
