import { createRequire } from 'node:module';

import type { ValidateFunction } from 'ajv';
import type { AssertionResult, AssertionRule, FailureDiff, HttpResponse } from '../types/index.js';

import { generateFailureDiff } from './diffReporter.js';

interface AjvInstance {
  compile(schema: object): ValidateFunction;
  errorsText(errors: ValidateFunction['errors']): string;
}

// AJV setup with ESM/CJS interop for NodeNext using createRequire
const _require = createRequire(import.meta.url);
const AjvCtor = _require('ajv') as { new(opts: { allErrors: boolean }): AjvInstance };
const addFormats = _require('ajv-formats') as (ajv: AjvInstance) => void;
const ajv: AjvInstance = new AjvCtor({ allErrors: true });
addFormats(ajv);

/**
 * Resolve a dot-notation path (e.g. "body.user.age" or "body.items.0.id")
 * against an object. Returns undefined if any segment is missing.
 */
function resolvePath(obj: unknown, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = obj;
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const idx = parseInt(seg, 10);
      if (isNaN(idx)) return undefined;
      current = current[idx];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    );
  }
  return false;
}

function makeResult(
  rule: AssertionRule,
  passed: boolean,
  message: string,
  diff?: FailureDiff,
): AssertionResult {
  if (diff !== undefined) {
    return { rule, passed, message, diff };
  }
  return { rule, passed, message };
}

function evaluateRule(rule: AssertionRule, response: HttpResponse): AssertionResult {
  // Status check
  if (rule.status !== undefined) {
    const passed = response.status === rule.status;
    return makeResult(
      rule, passed,
      passed
        ? `Status ${response.status} matches expected ${rule.status}`
        : `Expected status ${rule.status} but got ${response.status}`,
      passed ? undefined : generateFailureDiff(rule.status, response.status),
    );
  }

  // Response time check
  if (rule.responseTime !== undefined) {
    const { lt } = rule.responseTime as { lt: number };
    const passed = response.responseTimeMs < lt;
    return makeResult(
      rule, passed,
      passed
        ? `Response time ${response.responseTimeMs}ms < ${lt}ms`
        : `Response time ${response.responseTimeMs}ms exceeded limit ${lt}ms`,
      passed ? undefined : generateFailureDiff(`< ${lt}ms`, `${response.responseTimeMs}ms`),
    );
  }

  // All other rules are path-based
  const keys = Object.keys(rule).filter((k) => k !== 'status' && k !== 'responseTime');
  if (keys.length === 0) {
    return makeResult(rule, true, 'Empty rule (always passes)');
  }

  const key = keys[0];
  const expected = rule[key];

  // Header check
  if (key.startsWith('header.')) {
    const headerName = key.slice('header.'.length).toLowerCase();
    const headerValue = response.headers[headerName] ?? response.headers[headerName.toLowerCase()];
    const expectedStr = String(expected);
    const passed = headerValue?.toLowerCase() === expectedStr.toLowerCase();
    return makeResult(
      rule, passed,
      passed
        ? `Header ${headerName}: ${headerValue}`
        : `Expected header ${headerName} to be "${expectedStr}" but got "${headerValue}"`,
      passed ? undefined : generateFailureDiff(expectedStr, headerValue),
    );
  }

  let rootObj: unknown;
  let pathInRoot: string;

  if (key.startsWith('body.')) {
    rootObj = response.body;
    pathInRoot = key.slice('body.'.length);
  } else {
    rootObj = response.body;
    pathInRoot = key;
  }

  const actual = resolvePath(rootObj, pathInRoot);

  // "exists" check
  if (expected === 'exists') {
    const passed = actual !== undefined && actual !== null;
    return makeResult(
      rule, passed,
      passed ? `${key} exists` : `${key} does not exist`,
      passed ? undefined : generateFailureDiff('exists', actual),
    );
  }

  // JSON Schema check
  if (typeof expected === 'object' && expected !== null && 'schema' in (expected as object)) {
    const schema = (expected as { schema: unknown }).schema;
    const validate = ajv.compile(schema as object);
    const passed = validate(actual) === true;
    return makeResult(
      rule, passed,
      passed
        ? `${key} matches schema`
        : `${key} failed schema validation: ${ajv.errorsText(validate.errors)}`,
      passed ? undefined : generateFailureDiff(schema, actual),
    );
  }

  // Deep equality check
  const passed = deepEqual(actual, expected);
  return makeResult(
    rule, passed,
    passed
      ? `${key} equals expected value`
      : `${key}: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
    passed ? undefined : generateFailureDiff(expected, actual),
  );
}

export function evaluateAssertions(
  rules: AssertionRule[],
  response: HttpResponse,
): AssertionResult[] {
  return rules.map((rule) => evaluateRule(rule, response));
}
