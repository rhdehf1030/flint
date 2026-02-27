import type { ScenarioResult } from '@flint/core';

/**
 * Bounded LRU store for ScenarioResult objects.
 * Maintains insertion order; oldest entries are evicted when capacity is exceeded.
 */
export class LruResultStore {
  private readonly map: Map<string, ScenarioResult> = new Map();

  constructor(private readonly maxSize: number = 100) {}

  set(id: string, result: ScenarioResult): void {
    // Remove existing entry to update insertion order
    if (this.map.has(id)) {
      this.map.delete(id);
    }
    this.map.set(id, result);
    // Evict oldest if over capacity
    if (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }

  get(id: string): ScenarioResult | undefined {
    return this.map.get(id);
  }

  getLast(): ScenarioResult | undefined {
    if (this.map.size === 0) return undefined;
    // Newest entry is at the end of the Map (insertion order)
    let last: ScenarioResult | undefined;
    for (const v of this.map.values()) last = v;
    return last;
  }

  size(): number {
    return this.map.size;
  }
}

export const resultStore = new LruResultStore(100);
