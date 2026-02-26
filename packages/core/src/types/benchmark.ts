export interface BenchmarkOptions {
  concurrent: number;
  duration?: number;
  maxRequests?: number;
  rampUpSeconds?: number;
  timeoutMs?: number;
}

export interface PercentileStats {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  mean: number;
}

export interface BenchmarkResult {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  errorRate: number;
  rps: number;
  totalDurationMs: number;
  latency: PercentileStats;
  errors: Array<{ status: number; count: number }>;
}

export type LatencyHistogram = PercentileStats;
