import type { EnvMap, StepResult, WebSocketScenario } from '../types/index.js';
import { evaluateAssertions } from '../assertions/assertionEvaluator.js';
import { interpolate } from '../env/variableInterpolator.js';

interface SimpleWebSocket {
  send(data: string): void;
  close(): void;
  addEventListener(event: 'open', handler: () => void): void;
  addEventListener(event: 'error', handler: (e: Event) => void): void;
  addEventListener(event: 'message', handler: (e: { data: unknown }) => void, opts?: { once: boolean }): void;
}

export async function runWebSocketScenario(
  scenario: WebSocketScenario,
  vars: EnvMap,
): Promise<StepResult[]> {
  const results: StepResult[] = [];
  let ws: SimpleWebSocket | null = null;
  let connectUrl = '';

  // Dynamic import to avoid bundling issues
  const WebSocketImpl = (
    typeof WebSocket !== 'undefined'
      ? WebSocket
      : (await import('node:http').then(() => {
          // Throw meaningful error if native WS not available
          throw new Error(
            'WebSocket is not available in this environment. Requires Node.js 22+ or a WebSocket polyfill.',
          );
        }))
  ) as { new(url: string): SimpleWebSocket };

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i];
    const stepStart = Date.now();

    if (step.action === 'connect') {
      connectUrl = interpolate(step.url!, vars, false);
      ws = new WebSocketImpl(connectUrl);

      await new Promise<void>((resolve, reject) => {
        ws!.addEventListener('open', () => resolve());
        ws!.addEventListener('error', (e: Event) =>
          reject(new Error(`WebSocket connection failed: ${String(e)}`)),
        );
        setTimeout(
          () => reject(new Error('WebSocket connection timeout')),
          step.timeoutMs ?? 10000,
        );
      });

      results.push({
        stepIndex: i,
        operationId: 'ws-connect',
        request: { method: 'GET', url: connectUrl, headers: {}, queryParams: {}, body: { type: 'none' } },
        response: { status: 101, headers: {}, body: null, rawBody: '', responseTimeMs: Date.now() - stepStart },
        assertions: [],
        extractedVars: {},
        passed: true,
        durationMs: Date.now() - stepStart,
      });
    } else if (step.action === 'send' && ws) {
      const data =
        typeof step.data === 'string'
          ? interpolate(step.data, vars, false)
          : JSON.stringify(step.data);
      ws.send(data);

      results.push({
        stepIndex: i,
        operationId: 'ws-send',
        request: { method: 'GET', url: connectUrl, headers: {}, queryParams: {}, body: { type: 'raw', raw: data } },
        response: { status: 200, headers: {}, body: data, rawBody: data, responseTimeMs: Date.now() - stepStart },
        assertions: [],
        extractedVars: {},
        passed: true,
        durationMs: Date.now() - stepStart,
      });
    } else if (step.action === 'receive' && ws) {
      const received = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('WebSocket receive timeout')),
          step.timeoutMs ?? 10000,
        );
        ws!.addEventListener('message', (event: { data: unknown }) => {
          clearTimeout(timeout);
          resolve(String(event.data));
        }, { once: true });
      });

      let parsedBody: unknown = received;
      try {
        parsedBody = JSON.parse(received);
      } catch {
        /* keep as string */
      }

      const fakeResponse = {
        status: 200,
        headers: {},
        body: parsedBody,
        rawBody: received,
        responseTimeMs: Date.now() - stepStart,
      };

      const assertions = step.assertions ? evaluateAssertions(step.assertions, fakeResponse) : [];

      results.push({
        stepIndex: i,
        operationId: 'ws-receive',
        request: { method: 'GET', url: connectUrl, headers: {}, queryParams: {}, body: { type: 'none' } },
        response: fakeResponse,
        assertions,
        extractedVars: {},
        passed: assertions.every((a) => a.passed),
        durationMs: Date.now() - stepStart,
      });
    } else if (step.action === 'disconnect' && ws) {
      ws.close();
      ws = null;

      results.push({
        stepIndex: i,
        operationId: 'ws-disconnect',
        request: { method: 'GET', url: connectUrl, headers: {}, queryParams: {}, body: { type: 'none' } },
        response: { status: 200, headers: {}, body: null, rawBody: '', responseTimeMs: Date.now() - stepStart },
        assertions: [],
        extractedVars: {},
        passed: true,
        durationMs: Date.now() - stepStart,
      });
    }
  }

  if (ws) {
    ws.close();
  }

  return results;
}
