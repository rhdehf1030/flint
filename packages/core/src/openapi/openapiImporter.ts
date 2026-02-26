import type { OpenAPIV3 } from 'openapi-types';

import type { CollectionRequest } from '../types/index.js';

export function importFromOpenAPI(spec: OpenAPIV3.Document): CollectionRequest[] {
  const results: CollectionRequest[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation) continue;

      const operationId =
        operation.operationId ?? `${method.toUpperCase()}-${path.replace(/\//g, '-').replace(/^-/, '').replace(/\{([^}]+)\}/g, '$1')}`;

      const collectionRequest: CollectionRequest = {
        openapi: '3.0.0',
        info: {
          title: spec.info?.title ?? 'Imported API',
          version: spec.info?.version ?? '1.0.0',
          ...(spec.info?.description ? { description: spec.info.description } : {}),
        },
        ...(spec.servers ? { servers: spec.servers } : {}),
        paths: {
          [path]: {
            [method]: {
              ...operation,
              operationId,
            },
          },
        },
      };

      results.push(collectionRequest);
    }
  }

  return results;
}
