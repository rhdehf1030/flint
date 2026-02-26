import { describe, it, expect } from 'vitest';

import { buildRequest } from '../../src/http/requestBuilder.js';
import type { CollectionRequest } from '../../src/types/index.js';

function makeCollection(
  path: string,
  method: string,
  operationId: string,
  extra: Record<string, unknown> = {},
): CollectionRequest {
  return {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com' }],
    paths: {
      [path]: {
        [method]: {
          operationId,
          responses: { '200': { description: 'OK' } },
          ...extra,
        },
      },
    },
  };
}

describe('buildRequest', () => {
  it('builds a GET request with URL from servers', () => {
    const collection = makeCollection('/users', 'get', 'listUsers');
    const req = buildRequest(collection, {});
    expect(req.method).toBe('GET');
    expect(req.url).toBe('https://api.example.com/users');
  });

  it('interpolates URL path variables', () => {
    const collection = makeCollection('/users/{{USER_ID}}', 'get', 'getUser');
    const req = buildRequest(collection, { USER_ID: '42' });
    expect(req.url).toBe('https://api.example.com/users/42');
  });

  it('interpolates header values', () => {
    const collection = makeCollection('/data', 'get', 'getData', {
      parameters: [{ in: 'header', name: 'X-Api-Key', example: '{{API_KEY}}' }],
    });
    const req = buildRequest(collection, { API_KEY: 'secret-key' });
    expect(req.headers['X-Api-Key']).toBe('secret-key');
  });

  it('builds JSON body from requestBody example', () => {
    const collection = makeCollection('/users', 'post', 'createUser', {
      requestBody: {
        content: {
          'application/json': {
            example: { name: '{{USER_NAME}}', email: '{{EMAIL}}' },
          },
        },
      },
    });
    const req = buildRequest(collection, { USER_NAME: 'Alice', EMAIL: 'alice@example.com' });
    expect(req.body.type).toBe('json');
    expect(req.body.json).toEqual({ name: 'Alice', email: 'alice@example.com' });
  });

  it('sets default timeoutMs to 30000', () => {
    const collection = makeCollection('/test', 'get', 'test');
    const req = buildRequest(collection, {});
    expect(req.timeoutMs).toBe(30000);
  });

  it('applies overrides', () => {
    const collection = makeCollection('/test', 'get', 'test');
    const req = buildRequest(collection, {}, { timeoutMs: 5000, followRedirects: false });
    expect(req.timeoutMs).toBe(5000);
    expect(req.followRedirects).toBe(false);
  });

  it('body type is none for operations without requestBody', () => {
    const collection = makeCollection('/status', 'get', 'getStatus');
    const req = buildRequest(collection, {});
    expect(req.body.type).toBe('none');
  });
});
