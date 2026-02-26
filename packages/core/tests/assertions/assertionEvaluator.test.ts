import { describe, it, expect } from 'vitest';

import { evaluateAssertions } from '../../src/assertions/assertionEvaluator.js';
import type { HttpResponse } from '../../src/types/index.js';

function makeResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: { user: { id: 1, name: 'Alice', age: 30 }, token: 'abc123', items: [{ id: 10 }] },
    rawBody: '{}',
    responseTimeMs: 50,
    ...overrides,
  };
}

describe('evaluateAssertions', () => {
  describe('status rule', () => {
    it('passes when status matches', () => {
      const results = evaluateAssertions([{ status: 200 }], makeResponse());
      expect(results[0].passed).toBe(true);
    });

    it('fails when status does not match', () => {
      const results = evaluateAssertions([{ status: 201 }], makeResponse({ status: 200 }));
      expect(results[0].passed).toBe(false);
      expect(results[0].diff).toBeDefined();
    });
  });

  describe('responseTime rule', () => {
    it('passes when response time is within limit', () => {
      const results = evaluateAssertions(
        [{ responseTime: { lt: 100 } }],
        makeResponse({ responseTimeMs: 50 }),
      );
      expect(results[0].passed).toBe(true);
    });

    it('fails when response time exceeds limit', () => {
      const results = evaluateAssertions(
        [{ responseTime: { lt: 30 } }],
        makeResponse({ responseTimeMs: 50 }),
      );
      expect(results[0].passed).toBe(false);
    });
  });

  describe('body.path exists rule', () => {
    it('passes when path exists', () => {
      const results = evaluateAssertions([{ 'body.token': 'exists' }], makeResponse());
      expect(results[0].passed).toBe(true);
    });

    it('fails when path does not exist', () => {
      const results = evaluateAssertions([{ 'body.missing': 'exists' }], makeResponse());
      expect(results[0].passed).toBe(false);
    });

    it('fails when path is null', () => {
      const response = makeResponse({ body: { value: null } });
      const results = evaluateAssertions([{ 'body.value': 'exists' }], response);
      expect(results[0].passed).toBe(false);
    });
  });

  describe('body.path equality rule', () => {
    it('passes for exact string match', () => {
      const results = evaluateAssertions([{ 'body.token': 'abc123' }], makeResponse());
      expect(results[0].passed).toBe(true);
    });

    it('fails for mismatched value', () => {
      const results = evaluateAssertions([{ 'body.token': 'wrong' }], makeResponse());
      expect(results[0].passed).toBe(false);
    });

    it('passes for deep object equality', () => {
      const results = evaluateAssertions(
        [{ 'body.user': { id: 1, name: 'Alice', age: 30 } }],
        makeResponse(),
      );
      expect(results[0].passed).toBe(true);
    });

    it('passes for nested dot path', () => {
      const results = evaluateAssertions([{ 'body.user.name': 'Alice' }], makeResponse());
      expect(results[0].passed).toBe(true);
    });

    it('passes for array index path', () => {
      const results = evaluateAssertions([{ 'body.items.0.id': 10 }], makeResponse());
      expect(results[0].passed).toBe(true);
    });
  });

  describe('header rule', () => {
    it('passes when header matches (case insensitive)', () => {
      const results = evaluateAssertions(
        [{ 'header.content-type': 'application/json' }],
        makeResponse(),
      );
      expect(results[0].passed).toBe(true);
    });

    it('fails when header does not match', () => {
      const results = evaluateAssertions(
        [{ 'header.content-type': 'text/html' }],
        makeResponse(),
      );
      expect(results[0].passed).toBe(false);
    });
  });

  describe('JSON Schema rule', () => {
    it('passes when value matches schema', () => {
      const results = evaluateAssertions(
        [{ 'body.user.age': { schema: { type: 'number', minimum: 18 } } }],
        makeResponse(),
      );
      expect(results[0].passed).toBe(true);
    });

    it('fails when value does not match schema', () => {
      const results = evaluateAssertions(
        [{ 'body.user.age': { schema: { type: 'string' } } }],
        makeResponse(),
      );
      expect(results[0].passed).toBe(false);
    });
  });

  describe('multiple rules', () => {
    it('evaluates all rules independently', () => {
      const results = evaluateAssertions(
        [{ status: 200 }, { 'body.token': 'abc123' }, { 'body.missing': 'exists' }],
        makeResponse(),
      );
      expect(results).toHaveLength(3);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(true);
      expect(results[2].passed).toBe(false);
    });
  });
});
