import type { EnvMap, ExtractMap, HttpResponse } from '../types/index.js';

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

/**
 * Extract variables from a response using dot-notation paths.
 * Missing paths resolve to empty string (never throws).
 */
export function extractVariables(response: HttpResponse, extractMap: ExtractMap): EnvMap {
  const result: EnvMap = {};

  for (const [varName, pathExpr] of Object.entries(extractMap)) {
    // Path format: "body.some.path" or "header.content-type" etc.
    let value: unknown;

    if (pathExpr.startsWith('header.')) {
      const headerName = pathExpr.slice('header.'.length).toLowerCase();
      value = response.headers[headerName];
    } else if (pathExpr.startsWith('body.')) {
      const bodyPath = pathExpr.slice('body.'.length);
      value = resolvePath(response.body, bodyPath);
    } else {
      value = resolvePath(response.body, pathExpr);
    }

    result[varName] = value !== undefined && value !== null ? String(value) : '';
  }

  return result;
}
