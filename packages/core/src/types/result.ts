import type { HttpRequest, HttpResponse } from './http.js';
import type { AssertionRule } from './collection.js';

export interface FailureDiff {
  expected: unknown;
  actual: unknown;
  formattedDiff: string;
}

export interface AssertionResult {
  rule: AssertionRule;
  passed: boolean;
  message: string;
  diff?: FailureDiff;
}

export interface StepResult {
  stepIndex: number;
  operationId: string;
  request: HttpRequest;
  response: HttpResponse;
  assertions: AssertionResult[];
  extractedVars: Record<string, string>;
  passed: boolean;
  durationMs: number;
}

export interface ScenarioResult {
  id: string;
  scenarioName: string;
  scenarioPath: string;
  env: string;
  steps: StepResult[];
  passed: boolean;
  totalDurationMs: number;
  startedAt: string;
  finishedAt: string;
}
