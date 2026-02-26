import type { DiffField, DiffType, HttpResponse, ResponseDiff } from '../types/index.js';

function compareObjects(
  a: unknown,
  b: unknown,
  path: string,
  fields: DiffField[],
): void {
  if (a === b) return;

  const typeA = typeof a;
  const typeB = typeof b;

  if (typeA !== typeB) {
    fields.push({ path, type: 'changed', before: a, after: b, typeChanged: true });
    return;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= a.length) {
        fields.push({ path: `${path}.${i}`, type: 'added', after: b[i] });
      } else if (i >= b.length) {
        fields.push({ path: `${path}.${i}`, type: 'removed', before: a[i] });
      } else {
        compareObjects(a[i], b[i], `${path}.${i}`, fields);
      }
    }
    return;
  }

  if (typeA === 'object' && a !== null && b !== null) {
    const keysA = new Set(Object.keys(a as object));
    const keysB = new Set(Object.keys(b as object));

    for (const k of keysA) {
      const fieldPath = `${path}.${k}`;
      if (!keysB.has(k)) {
        fields.push({ path: fieldPath, type: 'removed', before: (a as Record<string, unknown>)[k] });
      } else {
        compareObjects(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k],
          fieldPath,
          fields,
        );
      }
    }

    for (const k of keysB) {
      if (!keysA.has(k)) {
        fields.push({
          path: `${path}.${k}`,
          type: 'added' as DiffType,
          after: (b as Record<string, unknown>)[k],
        });
      }
    }
    return;
  }

  // Primitive changed
  fields.push({ path, type: 'changed', before: a, after: b });
}

export function compareResponses(a: HttpResponse, b: HttpResponse): ResponseDiff {
  const fields: DiffField[] = [];

  // Compare headers (selected important ones)
  const headerKeys = new Set([
    ...Object.keys(a.headers),
    ...Object.keys(b.headers),
  ]);
  for (const key of headerKeys) {
    const va = a.headers[key];
    const vb = b.headers[key];
    if (va !== vb) {
      if (va === undefined) {
        fields.push({ path: `header.${key}`, type: 'added', after: vb });
      } else if (vb === undefined) {
        fields.push({ path: `header.${key}`, type: 'removed', before: va });
      } else {
        fields.push({ path: `header.${key}`, type: 'changed', before: va, after: vb });
      }
    }
  }

  // Compare body
  compareObjects(a.body, b.body, 'body', fields);

  const statusChanged = a.status !== b.status;

  return {
    statusChanged,
    ...(statusChanged ? { statusBefore: a.status, statusAfter: b.status } : {}),
    fields,
    hasDiff: statusChanged || fields.length > 0,
  };
}
