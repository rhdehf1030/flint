import type { EnvMap, SseScenario, StepResult } from '../types/index.js';
import { evaluateAssertions } from '../assertions/assertionEvaluator.js';
import { interpolate } from '../env/variableInterpolator.js';

export async function runSseScenario(
  scenario: SseScenario,
  vars: EnvMap,
): Promise<StepResult[]> {
  const results: StepResult[] = [];
  let connectUrl = '';

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i];
    const stepStart = Date.now();

    if (step.action === 'connect') {
      connectUrl = interpolate(step.url!, vars, false);
      results.push({
        stepIndex: i,
        operationId: 'sse-connect',
        request: { method: 'GET', url: connectUrl, headers: {}, queryParams: {}, body: { type: 'none' } },
        response: { status: 200, headers: {}, body: null, rawBody: '', responseTimeMs: Date.now() - stepStart },
        assertions: [],
        extractedVars: {},
        passed: true,
        durationMs: Date.now() - stepStart,
      });
    } else if (step.action === 'receive') {
      // Use undici to connect to SSE endpoint and collect events
      const { request: undiciRequest } = await import('undici');
      const maxEvents = step.maxEvents ?? 1;
      const timeoutMs = step.timeoutMs ?? 10000;

      const events: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), timeoutMs);

        undiciRequest(connectUrl, {
          method: 'GET',
          headers: { accept: 'text/event-stream' },
        }).then(async (response) => {
          for await (const chunk of response.body) {
            const text = (chunk as Buffer).toString('utf-8');
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                events.push(line.slice(5).trim());
                if (events.length >= maxEvents) {
                  clearTimeout(timeout);
                  resolve();
                  return;
                }
              }
            }
          }
          clearTimeout(timeout);
          resolve();
        }).catch((err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      const body = events.length === 1 ? events[0] : events;
      let parsedBody: unknown = body;
      if (typeof body === 'string') {
        try { parsedBody = JSON.parse(body); } catch { /* keep as string */ }
      }

      const fakeResponse = {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: parsedBody,
        rawBody: Array.isArray(body) ? body.join('\n') : body,
        responseTimeMs: Date.now() - stepStart,
      };

      const assertions = step.assertions
        ? evaluateAssertions(step.assertions, fakeResponse)
        : [];

      results.push({
        stepIndex: i,
        operationId: 'sse-receive',
        request: { method: 'GET', url: connectUrl, headers: {}, queryParams: {}, body: { type: 'none' } },
        response: fakeResponse,
        assertions,
        extractedVars: {},
        passed: assertions.every((a) => a.passed),
        durationMs: Date.now() - stepStart,
      });
    }
  }

  return results;
}
