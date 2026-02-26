import type { OpenAPIV3 } from 'openapi-types';

import type { CollectionRequest } from '../types/index.js';

export function exportToOpenAPI(requests: CollectionRequest[]): OpenAPIV3.Document {
  const paths: OpenAPIV3.PathsObject = {};
  const servers = requests[0]?.servers ?? [];

  for (const collection of requests) {
    for (const [path, methods] of Object.entries(collection.paths)) {
      if (!paths[path]) {
        paths[path] = {};
      }
      for (const [method, operation] of Object.entries(methods)) {
        (paths[path] as Record<string, unknown>)[method] = operation;
      }
    }
  }

  return {
    openapi: '3.0.0',
    info: {
      title: requests[0]?.info?.title ?? 'Flint API',
      version: requests[0]?.info?.version ?? '1.0.0',
    },
    servers,
    paths,
  };
}
