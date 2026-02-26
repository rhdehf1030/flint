import { resolve, basename, join } from 'node:path';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

import type { Command } from 'commander';
import yaml from 'js-yaml';
import {
  importFromOpenAPI,
  importFromSwagger2,
  importFromPostmanV21,
} from '@flint/core';
import type { PostmanV21Collection } from '@flint/core';

type DetectedFormat = 'openapi3' | 'swagger2' | 'postman' | 'unknown';

function detectFormat(raw: unknown): DetectedFormat {
  if (!raw || typeof raw !== 'object') return 'unknown';
  const doc = raw as Record<string, unknown>;

  if (typeof doc['openapi'] === 'string' && doc['openapi'].startsWith('3.')) {
    return 'openapi3';
  }
  if (typeof doc['swagger'] === 'string' && doc['swagger'].startsWith('2.')) {
    return 'swagger2';
  }
  if (doc['info'] && typeof (doc['info'] as Record<string, unknown>)['schema'] === 'string') {
    return 'postman';
  }
  if (doc['item'] && Array.isArray(doc['item'])) {
    return 'postman';
  }
  return 'unknown';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'operation';
}

export function registerImportCommand(program: Command): void {
  program
    .command('import <file>')
    .description('Import OpenAPI, Swagger 2.x, or Postman v2.1 collection into Flint collections')
    .option('-o, --output <dir>', 'output directory for collection files', './collections')
    .action((filePath: string, opts: { output: string }) => {
      const absPath = resolve(filePath);
      const outputDir = resolve(opts.output);

      let raw: unknown;
      const content = readFileSync(absPath, 'utf8');

      if (absPath.endsWith('.json')) {
        raw = JSON.parse(content) as unknown;
      } else {
        raw = yaml.load(content);
      }

      const format = detectFormat(raw);
      if (format === 'unknown') {
        console.error(`Cannot detect file format for ${basename(absPath)}. Expected OpenAPI 3.x, Swagger 2.x, or Postman v2.1.`);
        process.exit(1);
      }

      let requests;
      if (format === 'openapi3') {
        console.log(`Detected: OpenAPI 3.x`);
        requests = importFromOpenAPI(raw as Parameters<typeof importFromOpenAPI>[0]);
      } else if (format === 'swagger2') {
        console.log(`Detected: Swagger 2.x`);
        requests = importFromSwagger2(raw as Parameters<typeof importFromSwagger2>[0]);
      } else {
        console.log(`Detected: Postman v2.1`);
        requests = importFromPostmanV21(raw as PostmanV21Collection);
      }

      mkdirSync(outputDir, { recursive: true });

      let written = 0;
      for (const req of requests) {
        // Extract operationId from the paths structure
        const paths = req.paths ?? {};
        const pathEntry = Object.values(paths)[0] as Record<string, unknown> | undefined;
        const methodEntry = pathEntry ? (Object.values(pathEntry)[0] as Record<string, unknown> | undefined) : undefined;
        const operationId = (methodEntry?.['operationId'] as string | undefined) ?? `operation-${written}`;

        const filename = `${sanitizeFilename(operationId)}.yaml`;
        const outPath = join(outputDir, filename);
        writeFileSync(outPath, yaml.dump(req), 'utf8');
        console.log(`  \x1b[32m✓\x1b[0m ${filename}`);
        written++;
      }

      console.log(`\nImported ${written} operation(s) into ${outputDir}`);
    });
}
