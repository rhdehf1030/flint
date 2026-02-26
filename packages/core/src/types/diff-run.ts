import type { ResponseDiff } from './history.js';

export interface DiffRunOptions {
  envAName: string;
  envBName: string;
  stopOnFirstDiff?: boolean;
}

export interface EnvResponsePair {
  status: number;
  body: unknown;
  responseTimeMs: number;
}

export interface ResponseComparison {
  stepIndex: number;
  operationId: string;
  envA: EnvResponsePair;
  envB: EnvResponsePair;
  diff: ResponseDiff;
  hasDiff: boolean;
}

export interface DiffRunResult {
  scenarioName: string;
  envAName: string;
  envBName: string;
  comparisons: ResponseComparison[];
  hasDiff: boolean;
  totalDurationMs: number;
}
