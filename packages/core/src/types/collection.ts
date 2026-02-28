import type { OpenAPIV3 } from 'openapi-types';

export type Protocol = 'http' | 'graphql' | 'websocket' | 'sse';

export interface AssertionRule {
  status?: number;
  responseTime?: { lt: number };
  [bodyOrHeaderPath: string]: unknown;
}

export interface FlintMockConfig {
  delay?: number;
  statusCode?: number;
}

export interface FlintExtension {
  assertions?: AssertionRule[];
  baseUrl?: string;
  protocol?: Protocol;
  mock?: FlintMockConfig;
  auth?: string;
}

export interface Collection {
  name: string;
  dirPath: string;
  requests: CollectionRequest[];
}

export interface CollectionRequest {
  openapi: '3.0.0';
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: {
    [path: string]: {
      [method: string]: OpenAPIV3.OperationObject & {
        operationId: string;
        'x-flint'?: FlintExtension;
      };
    };
  };
  servers?: OpenAPIV3.ServerObject[];
}
