import type {
  BenchmarkOptions,
  BenchmarkResult,
  CollectionRequest,
  EnvMap,
  PercentileStats,
  ScenarioFile,
} from '../types/index.js';
import { runScenario } from '../scenario/scenarioRunner.js';

function calcPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function calcStats(latencies: number[]): PercentileStats {
  if (latencies.length === 0) {
    return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, mean: 0 };
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    p50: calcPercentile(sorted, 50),
    p75: calcPercentile(sorted, 75),
    p90: calcPercentile(sorted, 90),
    p95: calcPercentile(sorted, 95),
    p99: calcPercentile(sorted, 99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(sum / sorted.length),
  };
}

export async function runBenchmark(
  scenario: ScenarioFile,
  index: Map<string, CollectionRequest>,
  env: EnvMap,
  options: BenchmarkOptions,
): Promise<BenchmarkResult> {
  const {
    concurrent = 10,
    duration,
    maxRequests,
    rampUpSeconds = 0,
    timeoutMs: _timeoutMs = 10000,
  } = options;

  if (!duration && !maxRequests) {
    throw new Error('BenchmarkOptions requires either duration or maxRequests');
  }

  const startTime = Date.now();
  const endTime = duration ? startTime + duration * 1000 : Infinity;
  const latencies: number[] = [];
  const errorCounts = new Map<number, number>();

  let totalRequests = 0;
  let successCount = 0;
  let errorCount = 0;

  // Ramp-up: start with 1 worker, increase to concurrent over rampUpSeconds
  const getCurrentConcurrency = (): number => {
    if (rampUpSeconds <= 0) return concurrent;
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= rampUpSeconds) return concurrent;
    return Math.max(1, Math.ceil((elapsed / rampUpSeconds) * concurrent));
  };

  const inFlight = new Set<Promise<void>>();
  let done = false;

  async function runOne(): Promise<void> {
    const reqStart = Date.now();
    try {
      const result = await runScenario(scenario, index, env);
      const ms = Date.now() - reqStart;
      latencies.push(ms);
      if (result.passed) {
        successCount++;
      } else {
        // Assertion failures count as errors
        errorCount++;
        const status = result.steps[0]?.response?.status ?? 0;
        errorCounts.set(status, (errorCounts.get(status) ?? 0) + 1);
      }
    } catch {
      const ms = Date.now() - reqStart;
      latencies.push(ms);
      errorCount++;
      errorCounts.set(0, (errorCounts.get(0) ?? 0) + 1);
    }
    totalRequests++;
  }

  while (!done) {
    const shouldStop =
      (maxRequests !== undefined && totalRequests + inFlight.size >= maxRequests) ||
      (duration !== undefined && Date.now() >= endTime);

    if (shouldStop) {
      done = true;
      break;
    }

    const currentConcurrent = getCurrentConcurrency();
    while (inFlight.size < currentConcurrent && !done) {
      const shouldStopInner =
        (maxRequests !== undefined && totalRequests + inFlight.size >= maxRequests) ||
        (duration !== undefined && Date.now() >= endTime);
      if (shouldStopInner) { done = true; break; }

      const p = runOne().finally(() => { inFlight.delete(p); });
      inFlight.add(p);
    }

    if (inFlight.size > 0) {
      await Promise.race(inFlight);
    } else {
      break;
    }
  }

  // Wait for all in-flight to complete
  await Promise.all(inFlight);

  const totalDurationMs = Date.now() - startTime;
  const rps = totalRequests / (totalDurationMs / 1000);

  return {
    totalRequests,
    successCount,
    errorCount,
    successRate: totalRequests > 0 ? successCount / totalRequests : 0,
    errorRate: totalRequests > 0 ? errorCount / totalRequests : 0,
    rps: Math.round(rps * 100) / 100,
    totalDurationMs,
    latency: calcStats(latencies),
    errors: Array.from(errorCounts.entries()).map(([status, count]) => ({ status, count })),
  };
}
