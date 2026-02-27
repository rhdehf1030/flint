import type { CollectionRequest } from '@flint/core';

export interface OperationInfo {
  operationId: string;
  method: string;
  path: string;
  summary?: string | undefined;
}

/**
 * Extract the first (and usually only) operation from a CollectionRequest.
 * Flint stores one operation per collection file.
 */
export function getOperationInfo(collection: CollectionRequest): OperationInfo {
  for (const [path, methods] of Object.entries(collection.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const typedOp = op as { operationId: string; summary?: string };
      const result: OperationInfo = {
        operationId: typedOp.operationId,
        method,
        path,
      };
      if (typedOp.summary !== undefined) {
        result.summary = typedOp.summary;
      }
      return result;
    }
  }
  // Fallback
  return { operationId: collection.info.title, method: 'GET', path: '/' };
}

export function getServerUrl(collection: CollectionRequest): string {
  return collection.servers?.[0]?.url ?? '';
}
