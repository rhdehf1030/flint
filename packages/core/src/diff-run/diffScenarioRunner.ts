import type {
  CollectionRequest,
  DiffRunResult,
  EnvMap,
  ResponseComparison,
  ScenarioFile,
} from '../types/index.js';
import { runScenario } from '../scenario/scenarioRunner.js';
import { compareResponses } from '../history/responseComparator.js';

export async function runDiffScenario(
  scenario: ScenarioFile,
  index: Map<string, CollectionRequest>,
  envA: EnvMap,
  envB: EnvMap,
): Promise<DiffRunResult> {
  const startTime = Date.now();

  const [resultA, resultB] = await Promise.all([
    runScenario(scenario, index, envA),
    runScenario(scenario, index, envB),
  ]);

  const comparisons: ResponseComparison[] = [];
  const stepsLen = Math.max(resultA.steps.length, resultB.steps.length);

  for (let i = 0; i < stepsLen; i++) {
    const stepA = resultA.steps[i];
    const stepB = resultB.steps[i];

    if (!stepA || !stepB) continue;

    const diff = compareResponses(stepA.response, stepB.response);

    comparisons.push({
      stepIndex: i,
      operationId: stepA.operationId,
      envA: {
        status: stepA.response.status,
        body: stepA.response.body,
        responseTimeMs: stepA.response.responseTimeMs,
      },
      envB: {
        status: stepB.response.status,
        body: stepB.response.body,
        responseTimeMs: stepB.response.responseTimeMs,
      },
      diff,
      hasDiff: diff.hasDiff,
    });
  }

  return {
    scenarioName: scenario['x-flint-scenario'].name,
    envAName: 'envA',
    envBName: 'envB',
    comparisons,
    hasDiff: comparisons.some((c) => c.hasDiff),
    totalDurationMs: Date.now() - startTime,
  };
}
