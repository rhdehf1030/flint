import type { CollectionRequest, EnvMap, ScenarioFile, ScenarioResult } from '../types/index.js';

import { runScenario } from './scenarioRunner.js';

/**
 * Run multiple scenarios in parallel with a concurrency limit.
 * Uses a manual promise pool — no external libraries.
 */
export async function runScenariosInParallel(
  scenarios: ScenarioFile[],
  index: Map<string, CollectionRequest>,
  env: EnvMap,
  concurrency: number,
): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = new Array(scenarios.length);
  const queue = scenarios.map((s, i) => ({ scenario: s, index: i }));
  const inFlight = new Set<Promise<void>>();

  async function runOne(scenario: ScenarioFile, idx: number): Promise<void> {
    const result = await runScenario(scenario, index, env);
    results[idx] = result;
  }

  let queueIdx = 0;

  while (queueIdx < queue.length || inFlight.size > 0) {
    // Fill up to concurrency
    while (inFlight.size < concurrency && queueIdx < queue.length) {
      const { scenario, index: idx } = queue[queueIdx++];
      const p = runOne(scenario, idx).finally(() => {
        inFlight.delete(p);
      });
      inFlight.add(p);
    }

    if (inFlight.size > 0) {
      // Wait for the fastest to complete
      await Promise.race(inFlight);
    }
  }

  return results;
}
