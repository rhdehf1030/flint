import { resolve, relative } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

import type { Command } from 'commander';
import { validateCollectionFile } from '@flint/core';

function collectYamlFiles(pathOrGlob: string): string[] {
  try {
    const stat = statSync(pathOrGlob);
    if (stat.isDirectory()) {
      return walkDir(pathOrGlob);
    }
    return [pathOrGlob];
  } catch {
    // Not a directory; treat as glob pattern or single file
    return [pathOrGlob];
  }
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkDir(full));
    } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
      results.push(full);
    }
  }
  return results;
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate [paths...]')
    .description('Validate collection files against OpenAPI 3.x schema')
    .action(async (paths: string[]) => {
      const targets = paths.length > 0 ? paths : ['./collections'];
      const files: string[] = [];

      for (const t of targets) {
        files.push(...collectYamlFiles(resolve(t)));
      }

      if (files.length === 0) {
        console.log('No YAML files found to validate.');
        process.exit(0);
      }

      let hasErrors = false;

      for (const filePath of files) {
        const rel = relative(process.cwd(), filePath);
        const result = await validateCollectionFile(filePath);
        if (result.valid) {
          console.log(`\x1b[32m✓\x1b[0m ${rel}`);
        } else {
          hasErrors = true;
          console.log(`\x1b[31m✗\x1b[0m ${rel}`);
          for (const err of result.errors) {
            const loc = err.path ? ` (at ${err.path})` : '';
            console.log(`    ${err.message}${loc}`);
          }
        }
      }

      process.exit(hasErrors ? 1 : 0);
    });
}
