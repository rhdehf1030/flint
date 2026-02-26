import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

import type { CollectionRequest } from '../types/index.js';

import { parseCollectionFile, DuplicateOperationIdError } from './collectionParser.js';

function walkDir(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath));
      } else if (stat.isFile() && extname(entry) === '.yaml') {
        results.push(fullPath);
      }
    } catch {
      // skip unreadable entries
    }
  }
  return results;
}

/**
 * Recursively scan collectionDir for .yaml files, parse each as a CollectionRequest,
 * and index by operationId.
 * Throws DuplicateOperationIdError if two files share an operationId.
 */
export function buildCollectionIndex(collectionDir: string): Map<string, CollectionRequest> {
  const index = new Map<string, CollectionRequest>();
  const yamlFiles = walkDir(collectionDir);

  for (const filePath of yamlFiles) {
    let collection: CollectionRequest;
    try {
      collection = parseCollectionFile(filePath);
    } catch {
      // Skip files that fail to parse (non-collection yamls, etc.)
      continue;
    }

    for (const methods of Object.values(collection.paths)) {
      for (const operation of Object.values(methods)) {
        const op = operation as { operationId?: string };
        if (!op.operationId) continue;

        if (index.has(op.operationId)) {
          throw new DuplicateOperationIdError(op.operationId);
        }
        index.set(op.operationId, collection);
      }
    }
  }

  return index;
}
