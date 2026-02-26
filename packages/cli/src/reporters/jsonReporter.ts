import type { BenchmarkResult, DiffRunResult, ScenarioResult } from '@flint/core';

import type { Reporter } from './index.js';

export class JsonReporter implements Reporter {
  report(result: ScenarioResult | BenchmarkResult | DiffRunResult): void {
    console.log(JSON.stringify(result, null, 2));
  }
}
