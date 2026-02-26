import type { CollectionRequest } from '../types/index.js';

export interface IncomingRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
}

export interface MatchResult {
  collection: CollectionRequest;
  pathParams: Record<string, string>;
}

function pathToRegex(pathTemplate: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const pattern = pathTemplate
    .replace(/\{([^}]+)\}/g, (_, name: string) => {
      paramNames.push(name);
      return '([^/]+)';
    })
    .replace(/\//g, '\\/');
  return { regex: new RegExp(`^${pattern}$`), paramNames };
}

export function matchRequest(
  incoming: IncomingRequest,
  collections: CollectionRequest[],
): MatchResult | null {
  const method = incoming.method.toLowerCase();

  for (const collection of collections) {
    for (const [pathTemplate, methods] of Object.entries(collection.paths)) {
      if (!Object.prototype.hasOwnProperty.call(methods, method)) continue;

      const { regex, paramNames } = pathToRegex(pathTemplate);
      const match = incoming.path.match(regex);

      if (match) {
        const pathParams: Record<string, string> = {};
        for (let i = 0; i < paramNames.length; i++) {
          pathParams[paramNames[i]] = match[i + 1];
        }
        return { collection, pathParams };
      }
    }
  }

  return null;
}
