import { readFileSync } from 'node:fs';

import yaml from 'js-yaml';

import type { CollectionRequest } from '../types/index.js';

export class CollectionParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollectionParseError';
  }
}

export class DuplicateOperationIdError extends Error {
  constructor(public readonly operationId: string) {
    super(`Duplicate operationId: ${operationId}`);
    this.name = 'DuplicateOperationIdError';
  }
}

function validateCollection(doc: unknown, source: string): CollectionRequest {
  if (typeof doc !== 'object' || doc === null) {
    throw new CollectionParseError(`${source}: not a valid YAML object`);
  }

  const obj = doc as Record<string, unknown>;

  if (obj['openapi'] !== '3.0.0') {
    throw new CollectionParseError(`${source}: missing or invalid "openapi: 3.0.0" field`);
  }

  if (typeof obj['info'] !== 'object' || obj['info'] === null) {
    throw new CollectionParseError(`${source}: missing "info" field`);
  }

  if (typeof obj['paths'] !== 'object' || obj['paths'] === null) {
    throw new CollectionParseError(`${source}: missing "paths" field`);
  }

  // Validate that each operation has an operationId
  const paths = obj['paths'] as Record<string, Record<string, unknown>>;
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (typeof operation !== 'object' || operation === null) continue;
      const op = operation as Record<string, unknown>;
      if (!op['operationId'] || typeof op['operationId'] !== 'string') {
        throw new CollectionParseError(
          `${source}: operation ${method.toUpperCase()} ${path} is missing operationId`,
        );
      }
    }
  }

  return doc as CollectionRequest;
}

export function parseCollectionContent(content: string): CollectionRequest {
  let doc: unknown;
  try {
    doc = yaml.load(content);
  } catch (err) {
    throw new CollectionParseError(`Invalid YAML: ${(err as Error).message}`);
  }
  return validateCollection(doc, '<content>');
}

export function parseCollectionFile(filePath: string): CollectionRequest {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new CollectionParseError(
      `Failed to read collection file: ${filePath} — ${(err as Error).message}`,
    );
  }

  let doc: unknown;
  try {
    doc = yaml.load(content);
  } catch (err) {
    throw new CollectionParseError(`Invalid YAML in ${filePath}: ${(err as Error).message}`);
  }

  return validateCollection(doc, filePath);
}
