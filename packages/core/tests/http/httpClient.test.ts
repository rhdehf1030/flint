import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher, type Dispatcher } from 'undici';

import { executeRequest } from '../../src/http/httpClient.js';
import type { HttpRequest } from '../../src/types/index.js';

let mockAgent: MockAgent;
let originalDispatcher: Dispatcher;

beforeEach(() => {
  originalDispatcher = getGlobalDispatcher();
  mockAgent = new MockAgent();
  mockAgent.disableNetConnect();
  setGlobalDispatcher(mockAgent);
});

afterEach(async () => {
  await mockAgent.close();
  setGlobalDispatcher(originalDispatcher);
});

function makeGetRequest(url: string, overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    method: 'GET',
    url,
    headers: {},
    queryParams: {},
    body: { type: 'none' },
    timeoutMs: 5000,
    followRedirects: true,
    ...overrides,
  };
}

describe('executeRequest', () => {
  it('returns 200 for a successful GET', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/users', method: 'GET' }).reply(200, '{"users":[]}', {
      headers: { 'content-type': 'application/json' },
    });

    const response = await executeRequest(makeGetRequest('https://api.example.com/users'));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ users: [] });
  });

  it('parses JSON response body', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/data', method: 'GET' }).reply(200, '{"key":"value"}', {
      headers: { 'content-type': 'application/json' },
    });

    const response = await executeRequest(makeGetRequest('https://api.example.com/data'));
    expect(response.body).toEqual({ key: 'value' });
    expect(response.rawBody).toBe('{"key":"value"}');
  });

  it('returns raw string for non-JSON body', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/text', method: 'GET' }).reply(200, 'plain text', {
      headers: { 'content-type': 'text/plain' },
    });

    const response = await executeRequest(makeGetRequest('https://api.example.com/text'));
    expect(response.body).toBe('plain text');
    expect(response.rawBody).toBe('plain text');
  });

  it('captures response time', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/slow', method: 'GET' }).reply(200, '{}', {
      headers: { 'content-type': 'application/json' },
    });

    const response = await executeRequest(makeGetRequest('https://api.example.com/slow'));
    expect(response.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('returns HttpResponse for 4xx without throwing', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/not-found', method: 'GET' }).reply(404, '{"error":"Not Found"}', {
      headers: { 'content-type': 'application/json' },
    });

    const response = await executeRequest(makeGetRequest('https://api.example.com/not-found'));
    expect(response.status).toBe(404);
    expect((response.body as { error: string }).error).toBe('Not Found');
  });

  it('returns HttpResponse for 5xx without throwing', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/error', method: 'GET' }).reply(500, 'Internal Server Error', {
      headers: { 'content-type': 'text/plain' },
    });

    const response = await executeRequest(makeGetRequest('https://api.example.com/error'));
    expect(response.status).toBe(500);
  });

  it('sends POST with JSON body', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/users', method: 'POST' }).reply(201, '{"id":1}', {
      headers: { 'content-type': 'application/json' },
    });

    const response = await executeRequest({
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: { 'content-type': 'application/json' },
      queryParams: {},
      body: { type: 'json', json: { name: 'Alice' } },
      timeoutMs: 5000,
      followRedirects: true,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 1 });
  });

  it('normalizes response headers to lowercase', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/headers', method: 'GET' }).reply(200, '{}', {
      headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'abc123' },
    });

    const response = await executeRequest(makeGetRequest('https://api.example.com/headers'));
    expect(response.headers['content-type']).toBeDefined();
  });
});
