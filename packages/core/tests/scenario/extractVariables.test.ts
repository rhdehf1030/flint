import { describe, it, expect } from 'vitest';

import { extractVariables } from '../../src/scenario/extractVariables.js';
import type { HttpResponse } from '../../src/types/index.js';

function makeResponse(body: unknown = {}): HttpResponse {
  return {
    status: 200,
    headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' },
    body,
    rawBody: '{}',
    responseTimeMs: 50,
  };
}

describe('extractVariables', () => {
  it('extracts a top-level body field', () => {
    const result = extractVariables(makeResponse({ token: 'abc123' }), {
      TOKEN: 'body.token',
    });
    expect(result).toEqual({ TOKEN: 'abc123' });
  });

  it('extracts a nested body field', () => {
    const result = extractVariables(makeResponse({ user: { id: 42 } }), {
      USER_ID: 'body.user.id',
    });
    expect(result).toEqual({ USER_ID: '42' });
  });

  it('extracts an array index path', () => {
    const result = extractVariables(makeResponse({ items: [{ id: 10 }, { id: 20 }] }), {
      FIRST_ID: 'body.items.0.id',
      SECOND_ID: 'body.items.1.id',
    });
    expect(result).toEqual({ FIRST_ID: '10', SECOND_ID: '20' });
  });

  it('returns empty string for missing path (does not throw)', () => {
    const result = extractVariables(makeResponse({}), {
      MISSING: 'body.nonexistent',
    });
    expect(result).toEqual({ MISSING: '' });
  });

  it('returns empty string for null value', () => {
    const result = extractVariables(makeResponse({ value: null }), {
      VAL: 'body.value',
    });
    expect(result).toEqual({ VAL: '' });
  });

  it('extracts a response header', () => {
    const result = extractVariables(makeResponse(), {
      REQUEST_ID: 'header.x-request-id',
    });
    expect(result).toEqual({ REQUEST_ID: 'req-123' });
  });

  it('handles empty extractMap', () => {
    const result = extractVariables(makeResponse({ token: 'abc' }), {});
    expect(result).toEqual({});
  });
});
