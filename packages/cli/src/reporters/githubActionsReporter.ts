import type { BenchmarkResult, DiffRunResult, ScenarioResult } from '@flint/core';

import type { Reporter } from './index.js';

import { PrettyReporter } from './prettyReporter.js';

function isScenarioResult(r: ScenarioResult | BenchmarkResult | DiffRunResult): r is ScenarioResult {
  return 'steps' in r && 'scenarioName' in r;
}

export class GitHubActionsReporter implements Reporter {
  private pretty = new PrettyReporter();

  report(result: ScenarioResult | BenchmarkResult | DiffRunResult): void {
    this.pretty.report(result);

    if (!isScenarioResult(result)) return;

    for (const step of result.steps) {
      for (const assertion of step.assertions) {
        if (!assertion.passed) {
          const msg = assertion.message.replace(/\n/g, '%0A');
          console.log(`::error::${msg}`);
        }
      }
    }
  }
}
