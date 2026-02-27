import { describe, it, expect } from 'vitest';

import { LruResultStore } from '../src/lruStore.js';
import type { ScenarioResult } from '@flint/core';

function makeResult(id: string): ScenarioResult {
  return {
    id,
    scenarioName: `Test ${id}`,
    scenarioPath: '/test.yaml',
    env: 'base',
    steps: [],
    passed: true,
    totalDurationMs: 10,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  };
}

describe('LruResultStore', () => {
  it('stores and retrieves results by id', () => {
    const store = new LruResultStore(10);
    const r = makeResult('abc');
    store.set('abc', r);
    expect(store.get('abc')).toBe(r);
  });

  it('returns undefined for unknown id', () => {
    const store = new LruResultStore(10);
    expect(store.get('missing')).toBeUndefined();
  });

  it('getLast returns the most recently inserted', () => {
    const store = new LruResultStore(10);
    store.set('a', makeResult('a'));
    store.set('b', makeResult('b'));
    expect(store.getLast()?.id).toBe('b');
  });

  it('evicts oldest when capacity exceeded', () => {
    const store = new LruResultStore(3);
    store.set('a', makeResult('a'));
    store.set('b', makeResult('b'));
    store.set('c', makeResult('c'));
    store.set('d', makeResult('d')); // evicts 'a'
    expect(store.get('a')).toBeUndefined();
    expect(store.get('d')).toBeDefined();
    expect(store.size()).toBe(3);
  });

  it('getLast returns undefined for empty store', () => {
    const store = new LruResultStore(10);
    expect(store.getLast()).toBeUndefined();
  });
});
