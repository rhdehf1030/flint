import type { CollectionRequest } from '@flint/core';

export interface OperationInfo {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
}

export function getOperationInfo(collection: CollectionRequest): OperationInfo {
  for (const [path, methods] of Object.entries(collection.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const typedOp = op as { operationId: string; summary?: string };
      const info: OperationInfo = { operationId: typedOp.operationId, method, path };
      if (typedOp.summary !== undefined) info.summary = typedOp.summary;
      return info;
    }
  }
  return { operationId: collection.info.title, method: 'GET', path: '/' };
}
