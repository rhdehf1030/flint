import { randomUUID } from 'node:crypto';

import type {
  CollectionRequest,
  EnvMap,
  ScenarioFile,
  ScenarioResult,
  ScenarioStep,
  StepResult,
} from '../types/index.js';
import { evaluateAssertions } from '../assertions/assertionEvaluator.js';
import { buildRequest } from '../http/requestBuilder.js';
import { executeRequest } from '../http/httpClient.js';

import { extractVariables } from './extractVariables.js';

export class UnknownOperationError extends Error {
  constructor(public readonly operationId: string) {
    super(`Unknown operationId: ${operationId}`);
    this.name = 'UnknownOperationError';
  }
}

function getOperationFromCollection(
  collection: CollectionRequest,
  operationId: string,
): { path: string; method: string } | null {
  for (const [path, methods] of Object.entries(collection.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const op = operation as { operationId?: string };
      if (op.operationId === operationId) {
        return { path, method };
      }
    }
  }
  return null;
}

async function runStep(
  step: ScenarioStep,
  index: Map<string, CollectionRequest>,
  vars: EnvMap,
  stepIndex: number,
): Promise<StepResult> {
  const collection = index.get(step.operationId);
  if (!collection) {
    throw new UnknownOperationError(step.operationId);
  }

  const opInfo = getOperationFromCollection(collection, step.operationId);
  if (!opInfo) {
    throw new UnknownOperationError(step.operationId);
  }

  const overrides: Partial<Parameters<typeof buildRequest>[2]> = {};
  if (step.headers) overrides.headers = { ...step.headers };
  if (step.body !== undefined) overrides.body = { type: 'json', json: step.body };

  const request = buildRequest(collection, vars, overrides);

  const stepStart = Date.now();
  const response = await executeRequest(request);
  const durationMs = Date.now() - stepStart;

  // Gather assertions from step + collection x-flint block
  const op = collection.paths[opInfo.path][opInfo.method] as Record<string, unknown>;
  const xFlint = op['x-flint'] as { assertions?: Record<string, unknown>[] } | undefined;
  const collectionRules = xFlint?.assertions ?? [];
  const stepRules = step.assertions ?? [];
  const allRules = [...collectionRules, ...stepRules];

  const assertions = evaluateAssertions(allRules, response);

  const extractedVars = step.extract ? extractVariables(response, step.extract) : {};

  const passed = assertions.every((a) => a.passed);

  return {
    stepIndex,
    operationId: step.operationId,
    request,
    response,
    assertions,
    extractedVars,
    passed,
    durationMs,
  };
}

export async function runScenario(
  scenario: ScenarioFile,
  index: Map<string, CollectionRequest>,
  env: EnvMap,
): Promise<ScenarioResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  const scenarioData = scenario['x-flint-scenario'];
  const steps: StepResult[] = [];
  let vars = { ...env };

  for (let i = 0; i < scenarioData.steps.length; i++) {
    const step = scenarioData.steps[i];
    const stepResult = await runStep(step, index, vars, i);
    steps.push(stepResult);

    // Merge extracted variables for subsequent steps
    vars = { ...vars, ...stepResult.extractedVars };
  }

  const finishedAt = new Date().toISOString();
  const totalDurationMs = Date.now() - startTime;
  const passed = steps.every((s) => s.passed);

  return {
    id: randomUUID(),
    scenarioName: scenarioData.name,
    scenarioPath: '',
    env: 'base',
    steps,
    passed,
    totalDurationMs,
    startedAt,
    finishedAt,
  };
}
