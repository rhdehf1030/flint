import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  parseCollectionContent,
  parseCollectionFile,
  CollectionParseError,
  DuplicateOperationIdError,
} from '../../src/collection/collectionParser.js';
import { buildCollectionIndex } from '../../src/collection/collectionIndex.js';

const VALID_COLLECTION = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /users:
    get:
      operationId: listUsers
      summary: List users
      responses:
        "200":
          description: OK
`;

const COLLECTION_WITH_XFLINT = `
openapi: "3.0.0"
info:
  title: Auth API
  version: "1.0.0"
paths:
  /auth/login:
    post:
      operationId: authLogin
      summary: Login
      x-flint:
        assertions:
          - status: 200
          - "body.token": exists
      responses:
        "200":
          description: OK
`;

describe('parseCollectionContent', () => {
  it('parses a valid collection', () => {
    const result = parseCollectionContent(VALID_COLLECTION);
    expect(result.openapi).toBe('3.0.0');
    expect(result.info.title).toBe('Test API');
    expect(result.paths['/users']['get'].operationId).toBe('listUsers');
  });

  it('parses x-flint extension block', () => {
    const result = parseCollectionContent(COLLECTION_WITH_XFLINT);
    const op = result.paths['/auth/login']['post'];
    expect(op['x-flint']).toBeDefined();
    expect(op['x-flint']?.assertions).toHaveLength(2);
  });

  it('throws CollectionParseError for missing openapi field', () => {
    const content = `
info:
  title: Test
  version: "1.0.0"
paths: {}
`;
    expect(() => parseCollectionContent(content)).toThrow(CollectionParseError);
  });

  it('throws CollectionParseError for missing operationId', () => {
    const content = `
openapi: "3.0.0"
info:
  title: Test
  version: "1.0.0"
paths:
  /users:
    get:
      summary: No operationId
      responses:
        "200":
          description: OK
`;
    expect(() => parseCollectionContent(content)).toThrow(CollectionParseError);
  });

  it('throws CollectionParseError for invalid YAML', () => {
    expect(() => parseCollectionContent('{ invalid: yaml: ][')).toThrow(CollectionParseError);
  });

  it('succeeds when x-flint block is absent', () => {
    const result = parseCollectionContent(VALID_COLLECTION);
    expect(result.paths['/users']['get']['x-flint']).toBeUndefined();
  });
});

describe('parseCollectionFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `flint-col-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads and parses a valid file', () => {
    const filePath = join(tmpDir, 'valid.yaml');
    writeFileSync(filePath, VALID_COLLECTION);
    const result = parseCollectionFile(filePath);
    expect(result.info.title).toBe('Test API');
  });

  it('throws CollectionParseError for non-existent file', () => {
    expect(() => parseCollectionFile('/nonexistent/file.yaml')).toThrow(CollectionParseError);
  });
});

describe('buildCollectionIndex', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `flint-index-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('indexes valid yaml files by operationId', () => {
    writeFileSync(join(tmpDir, 'users.yaml'), VALID_COLLECTION);
    const index = buildCollectionIndex(tmpDir);
    expect(index.has('listUsers')).toBe(true);
  });

  it('ignores non-yaml files', () => {
    writeFileSync(join(tmpDir, 'readme.txt'), 'some text');
    writeFileSync(join(tmpDir, 'users.yaml'), VALID_COLLECTION);
    const index = buildCollectionIndex(tmpDir);
    expect(index.size).toBe(1);
  });

  it('throws DuplicateOperationIdError for duplicate operationIds', () => {
    writeFileSync(join(tmpDir, 'a.yaml'), VALID_COLLECTION);
    writeFileSync(join(tmpDir, 'b.yaml'), VALID_COLLECTION);
    expect(() => buildCollectionIndex(tmpDir)).toThrow(DuplicateOperationIdError);
  });

  it('returns empty map for empty directory', () => {
    const index = buildCollectionIndex(tmpDir);
    expect(index.size).toBe(0);
  });

  it('recursively scans subdirectories', () => {
    const subDir = join(tmpDir, 'auth');
    mkdirSync(subDir);
    writeFileSync(join(subDir, 'login.yaml'), COLLECTION_WITH_XFLINT);
    const index = buildCollectionIndex(tmpDir);
    expect(index.has('authLogin')).toBe(true);
  });
});
