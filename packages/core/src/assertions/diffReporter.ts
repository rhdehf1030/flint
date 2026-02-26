import type { FailureDiff } from '../types/index.js';

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  return JSON.stringify(value, null, 2);
}

export function generateFailureDiff(expected: unknown, actual: unknown): FailureDiff {
  const expectedStr = formatValue(expected);
  const actualStr = formatValue(actual);

  const formattedDiff = `Expected: ${expectedStr}\nActual:   ${actualStr}`;

  return { expected, actual, formattedDiff };
}
