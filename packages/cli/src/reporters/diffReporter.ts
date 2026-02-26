import type { BenchmarkResult, DiffRunResult, ScenarioResult } from '@flint/core';

import type { Reporter } from './index.js';

export class DiffReporter implements Reporter {
  report(result: ScenarioResult | BenchmarkResult | DiffRunResult): void {
    if (!('comparisons' in result)) {
      console.log('DiffReporter: expected DiffRunResult');
      return;
    }

    const diff = result as DiffRunResult;
    const status = diff.hasDiff ? '\x1b[33m⚠ DIFF\x1b[0m' : '\x1b[32m✓ NO DIFF\x1b[0m';
    console.log(`\n${status}  ${diff.envAName} ↔ ${diff.envBName}  (${diff.totalDurationMs}ms)`);

    for (const comparison of diff.comparisons) {
      if (!comparison.hasDiff) continue;

      console.log(`\n  Step ${comparison.stepIndex + 1}: ${comparison.operationId}`);

      if (comparison.diff.statusChanged) {
        console.log(`  \x1b[31m- status: ${comparison.diff.statusBefore}\x1b[0m`);
        console.log(`  \x1b[32m+ status: ${comparison.diff.statusAfter}\x1b[0m`);
      }

      for (const field of comparison.diff.fields) {
        const color = field.type === 'added' ? '\x1b[32m+' : field.type === 'removed' ? '\x1b[31m-' : '\x1b[33m~';
        console.log(`  ${color} ${field.path}\x1b[0m`);
        if (field.before !== undefined) {
          console.log(`    \x1b[31m- ${JSON.stringify(field.before)}\x1b[0m`);
        }
        if (field.after !== undefined) {
          console.log(`    \x1b[32m+ ${JSON.stringify(field.after)}\x1b[0m`);
        }
      }
    }
    console.log('');
  }
}
