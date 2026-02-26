import type { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

import type { CollectionRequest } from '../types/index.js';

import { importFromOpenAPI } from './openapiImporter.js';

function convertSwagger2ToOpenAPI3(spec: OpenAPIV2.Document): OpenAPIV3.Document {
  const servers: OpenAPIV3.ServerObject[] = [];
  if (spec.host) {
    const scheme = spec.schemes?.[0] ?? 'https';
    const basePath = spec.basePath ?? '';
    servers.push({ url: `${scheme}://${spec.host}${basePath}` });
  }

  const paths: OpenAPIV3.PathsObject = {};
  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem) continue;
    paths[path] = pathItem as unknown as OpenAPIV3.PathItemObject;
  }

  return {
    openapi: '3.0.0',
    info: spec.info as OpenAPIV3.InfoObject,
    servers,
    paths,
  };
}

export function importFromSwagger2(spec: OpenAPIV2.Document): CollectionRequest[] {
  const openapi3 = convertSwagger2ToOpenAPI3(spec);
  return importFromOpenAPI(openapi3);
}
