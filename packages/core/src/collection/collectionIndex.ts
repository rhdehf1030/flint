import { readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

import type { Collection, CollectionRequest } from '../types/index.js';

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
 * Scan collectionDir grouping requests by first-level subfolder.
 * - Subfolders → Collection { name: folderName, requests: [...] }
 * - YAML files directly in collectionsDir root → Collection { name: "default" }
 * Returns only non-empty collections.
 */
export function buildCollections(collectionsDir: string): Collection[] {
  const collections: Collection[] = [];
  let rootEntries: string[];
  try {
    rootEntries = readdirSync(collectionsDir);
  } catch {
    return collections;
  }

  const defaultRequests: CollectionRequest[] = [];

  for (const entry of rootEntries) {
    const fullPath = join(collectionsDir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        const requests: CollectionRequest[] = [];
        for (const filePath of walkDir(fullPath)) {
          try {
            requests.push(parseCollectionFile(filePath));
          } catch {
            // skip unparseable files
          }
        }
        if (requests.length > 0) {
          collections.push({ name: basename(fullPath), dirPath: fullPath, requests });
        }
      } else if (stat.isFile() && extname(entry) === '.yaml') {
        try {
          defaultRequests.push(parseCollectionFile(fullPath));
        } catch {
          // skip unparseable files
        }
      }
    } catch {
      // skip unreadable entries
    }
  }

  if (defaultRequests.length > 0) {
    collections.unshift({ name: 'default', dirPath: collectionsDir, requests: defaultRequests });
  }

  return collections;
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
