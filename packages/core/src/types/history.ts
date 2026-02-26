import type { HttpRequest, HttpResponse } from './http.js';

export interface HistoryEntry {
  id: string;
  operationId: string;
  timestamp: string;
  request: HttpRequest;
  response: HttpResponse;
}

export type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffField {
  path: string;
  type: DiffType;
  before?: unknown;
  after?: unknown;
  typeChanged?: boolean;
}

export interface ResponseDiff {
  statusChanged: boolean;
  statusBefore?: number;
  statusAfter?: number;
  fields: DiffField[];
  hasDiff: boolean;
}
