import type { BenchmarkResult, DiffRunResult, ScenarioResult } from '@flint/core';

import { BenchReporter } from './benchReporter.js';
import { DiffReporter } from './diffReporter.js';
import { GitHubActionsReporter } from './githubActionsReporter.js';
import { JsonReporter } from './jsonReporter.js';
import { JUnitReporter } from './junitReporter.js';
import { PrettyReporter } from './prettyReporter.js';

export interface Reporter {
  report(result: ScenarioResult | BenchmarkResult | DiffRunResult): void;
}

export function getReporter(format: string): Reporter {
  switch (format.toLowerCase()) {
    case 'json':
      return new JsonReporter();
    case 'junit':
      return new JUnitReporter();
    case 'github-actions':
    case 'github':
      return new GitHubActionsReporter();
    case 'diff':
      return new DiffReporter();
    case 'bench':
      return new BenchReporter();
    case 'pretty':
    default:
      return new PrettyReporter();
  }
}
