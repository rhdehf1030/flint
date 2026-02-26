import type { CollectionRequest, MockServerHandle } from '../types/index.js';

import { matchRequest } from './mockRequestMatcher.js';
import { generateMockResponse } from './mockResponseGenerator.js';

export interface MockServerLogic {
  handle(method: string, path: string, headers?: Record<string, string>): Promise<{
    status: number;
    headers: Record<string, string>;
    body: unknown;
    delay: number;
  }>;
}

/**
 * Create mock server logic (pure, no port binding).
 * The returned handle is a logic-only object.
 * CLI/MCP are responsible for binding to a port.
 */
export function createMockServer(collections: CollectionRequest[]): MockServerHandle & MockServerLogic {
  let stopped = false;

  return {
    baseUrl: '',

    async handle(method: string, path: string, headers?: Record<string, string>) {
      if (stopped) throw new Error('Mock server is stopped');

      const incoming = headers !== undefined
        ? { method, path, headers }
        : { method, path };
      const match = matchRequest(incoming, collections);

      if (!match) {
        return {
          status: 404,
          headers: { 'content-type': 'application/json' },
          body: { error: 'Not Found' },
          delay: 0,
        };
      }

      const response = generateMockResponse(match.collection, match.pathParams, method);
      return response;
    },

    async stop() {
      stopped = true;
    },
  };
}
