import type { CollectionRequest } from './collection.js';

export interface MockServerConfig {
  collections: CollectionRequest[];
  defaultDelay?: number;
  verbose?: boolean;
}

export interface MockServerHandle {
  baseUrl: string;
  stop(): Promise<void>;
}

export interface MockRoute {
  method: string;
  path: string;
  operationId: string;
}

export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  delay: number;
}
