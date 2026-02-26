import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher, type Dispatcher } from 'undici';

import { runScenario } from '../../src/scenario/scenarioRunner.js';
import { UnknownOperationError } from '../../src/scenario/scenarioRunner.js';
import type { CollectionRequest, ScenarioFile } from '../../src/types/index.js';

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

function makeCollection(operationId: string, path: string, method = 'get'): CollectionRequest {
  return {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com' }],
    paths: {
      [path]: {
        [method]: {
          operationId,
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  };
}

function makeScenario(steps: { operationId: string; extract?: Record<string, string>; assertions?: Record<string, unknown>[] }[]): ScenarioFile {
  return {
    'x-flint-scenario': {
      name: 'Test Scenario',
      version: '1.0',
      steps: steps.map((s) => ({
        operationId: s.operationId,
        extract: s.extract,
        assertions: s.assertions,
      })),
    },
  };
}

describe('runScenario', () => {
  it('runs a single step scenario successfully', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/users', method: 'GET' }).reply(200, '{"users":[]}', {
      headers: { 'content-type': 'application/json' },
    });

    const index = new Map([['listUsers', makeCollection('listUsers', '/users')]]);
    const scenario = makeScenario([{ operationId: 'listUsers' }]);

    const result = await runScenario(scenario, index, {});
    expect(result.passed).toBe(true);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].operationId).toBe('listUsers');
  });

  it('extracts variables and injects into next step', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/auth/login', method: 'GET' }).reply(200, '{"token":"secret-token"}', {
      headers: { 'content-type': 'application/json' },
    });
    client.intercept({ path: '/profile', method: 'GET' }).reply(200, '{"name":"Alice"}', {
      headers: { 'content-type': 'application/json' },
    });

    const loginCollection = makeCollection('authLogin', '/auth/login');
    const profileCollection = makeCollection('getProfile', '/profile');

    const index = new Map([
      ['authLogin', loginCollection],
      ['getProfile', profileCollection],
    ]);

    const scenario = makeScenario([
      { operationId: 'authLogin', extract: { TOKEN: 'body.token' } },
      { operationId: 'getProfile' },
    ]);

    const result = await runScenario(scenario, index, {});
    expect(result.steps[0].extractedVars).toEqual({ TOKEN: 'secret-token' });
    expect(result.passed).toBe(true);
  });

  it('records assertion failure but continues to next step', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/a', method: 'GET' }).reply(404, '{}', {
      headers: { 'content-type': 'application/json' },
    });
    client.intercept({ path: '/b', method: 'GET' }).reply(200, '{}', {
      headers: { 'content-type': 'application/json' },
    });

    const index = new Map([
      ['getA', makeCollection('getA', '/a')],
      ['getB', makeCollection('getB', '/b')],
    ]);

    const scenario = makeScenario([
      { operationId: 'getA', assertions: [{ status: 200 }] },
      { operationId: 'getB', assertions: [{ status: 200 }] },
    ]);

    const result = await runScenario(scenario, index, {});
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].passed).toBe(false);
    expect(result.steps[1].passed).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('throws UnknownOperationError for unknown operationId', async () => {
    const index = new Map<string, CollectionRequest>();
    const scenario = makeScenario([{ operationId: 'unknownOp' }]);
    await expect(runScenario(scenario, index, {})).rejects.toThrow(UnknownOperationError);
  });

  it('includes id, startedAt, finishedAt in result', async () => {
    const client = mockAgent.get('https://api.example.com');
    client.intercept({ path: '/test', method: 'GET' }).reply(200, '{}', {
      headers: { 'content-type': 'application/json' },
    });

    const index = new Map([['testOp', makeCollection('testOp', '/test')]]);
    const scenario = makeScenario([{ operationId: 'testOp' }]);

    const result = await runScenario(scenario, index, {});
    expect(result.id).toBeTruthy();
    expect(result.startedAt).toBeTruthy();
    expect(result.finishedAt).toBeTruthy();
  });
});
