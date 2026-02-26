import type { BenchmarkResult, DiffRunResult, ScenarioResult } from '@flint/core';

import type { Reporter } from './index.js';

export class BenchReporter implements Reporter {
  report(result: ScenarioResult | BenchmarkResult | DiffRunResult): void {
    if (!('rps' in result)) {
      console.log('BenchReporter: expected BenchmarkResult');
      return;
    }
    const bench = result as BenchmarkResult;

    console.log('\n\x1b[36m╔══════════════════════════════════╗');
    console.log('║       Benchmark Results          ║');
    console.log('╚══════════════════════════════════╝\x1b[0m');
    console.log(`  Total Requests: ${bench.totalRequests}`);
    console.log(`  Duration:       ${bench.totalDurationMs}ms`);
    console.log(`  RPS:            \x1b[32m${bench.rps}\x1b[0m`);
    console.log(`  Success Rate:   ${(bench.successRate * 100).toFixed(1)}%`);
    console.log(`  Error Rate:     ${(bench.errorRate * 100).toFixed(1)}%`);

    console.log('\n  Latency Distribution:');
    const max = bench.latency.max || 1;
    const bars: Array<[string, number]> = [
      ['p50', bench.latency.p50],
      ['p75', bench.latency.p75],
      ['p90', bench.latency.p90],
      ['p95', bench.latency.p95],
      ['p99', bench.latency.p99],
    ];

    for (const [label, val] of bars) {
      const width = Math.round((val / max) * 30);
      const bar = '█'.repeat(width) + '░'.repeat(30 - width);
      console.log(`  ${label.padEnd(4)} ${bar} ${val}ms`);
    }

    console.log(`\n  min: ${bench.latency.min}ms  mean: ${bench.latency.mean}ms  max: ${bench.latency.max}ms\n`);
  }
}
