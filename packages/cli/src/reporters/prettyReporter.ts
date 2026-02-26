import type { BenchmarkResult, DiffRunResult, ScenarioResult } from '@flint/core';

import type { Reporter } from './index.js';

const PASS = '✓';
const FAIL = '✗';

function isScenarioResult(r: ScenarioResult | BenchmarkResult | DiffRunResult): r is ScenarioResult {
  return 'steps' in r && 'scenarioName' in r;
}

function isBenchmarkResult(r: ScenarioResult | BenchmarkResult | DiffRunResult): r is BenchmarkResult {
  return 'rps' in r && 'latency' in r;
}

export class PrettyReporter implements Reporter {
  report(result: ScenarioResult | BenchmarkResult | DiffRunResult): void {
    if (isScenarioResult(result)) {
      this.reportScenario(result);
    } else if (isBenchmarkResult(result)) {
      this.reportBenchmark(result);
    } else {
      this.reportDiff(result as DiffRunResult);
    }
  }

  private reportScenario(result: ScenarioResult): void {
    const status = result.passed ? `\x1b[32m${PASS} PASS\x1b[0m` : `\x1b[31m${FAIL} FAIL\x1b[0m`;
    console.log(`\n${status}  ${result.scenarioName}  \x1b[90m(${result.totalDurationMs}ms)\x1b[0m`);

    for (const step of result.steps) {
      const icon = step.passed ? `\x1b[32m${PASS}\x1b[0m` : `\x1b[31m${FAIL}\x1b[0m`;
      console.log(`  ${icon} [${step.stepIndex + 1}] ${step.operationId}  \x1b[90m${step.response.status}  ${step.durationMs}ms\x1b[0m`);

      for (const assertion of step.assertions) {
        if (!assertion.passed) {
          console.log(`      \x1b[31m${FAIL} ${assertion.message}\x1b[0m`);
          if (assertion.diff) {
            console.log(`        \x1b[33m${assertion.diff.formattedDiff.replace(/\n/g, '\n        ')}\x1b[0m`);
          }
        }
      }
    }
    console.log('');
  }

  private reportBenchmark(result: BenchmarkResult): void {
    console.log('\n\x1b[36m── Benchmark Results ──\x1b[0m');
    console.log(`  Requests:     ${result.totalRequests}`);
    console.log(`  Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
    console.log(`  RPS:          ${result.rps}`);
    console.log(`  Latency:`);
    console.log(`    p50: ${result.latency.p50}ms   p75: ${result.latency.p75}ms`);
    console.log(`    p90: ${result.latency.p90}ms   p95: ${result.latency.p95}ms   p99: ${result.latency.p99}ms`);
    console.log(`    min: ${result.latency.min}ms   max: ${result.latency.max}ms   mean: ${result.latency.mean}ms`);
    console.log('');
  }

  private reportDiff(result: DiffRunResult): void {
    const status = result.hasDiff ? `\x1b[33m⚠ DIFF FOUND\x1b[0m` : `\x1b[32m${PASS} NO DIFF\x1b[0m`;
    console.log(`\n${status}  ${result.scenarioName}  (${result.envAName} vs ${result.envBName})`);

    for (const comparison of result.comparisons) {
      if (comparison.hasDiff) {
        console.log(`  \x1b[33m[${comparison.stepIndex + 1}] ${comparison.operationId}\x1b[0m`);
        if (comparison.diff.statusChanged) {
          console.log(`    Status: ${comparison.diff.statusBefore} → ${comparison.diff.statusAfter}`);
        }
        for (const field of comparison.diff.fields) {
          console.log(`    \x1b[33m${field.type.toUpperCase()}\x1b[0m ${field.path}`);
        }
      }
    }
    console.log('');
  }
}
