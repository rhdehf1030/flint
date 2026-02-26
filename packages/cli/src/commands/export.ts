import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

import type { Command } from 'commander';
import yaml from 'js-yaml';
import { buildCollectionIndex, exportToOpenAPI } from '@flint/core';

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export Flint collections to OpenAPI 3.x document')
    .option('-f, --format <fmt>', 'output format (openapi)', 'openapi')
    .option('-c, --collections <dir>', 'collections directory', './collections')
    .option('-o, --output <dir>', 'output directory', '.')
    .option('--filename <name>', 'output filename (without extension)', 'openapi')
    .action((opts: { format: string; collections: string; output: string; filename: string }) => {
      const collectionsDir = resolve(opts.collections);
      const outputDir = resolve(opts.output);

      const index = buildCollectionIndex(collectionsDir);
      const requests = [...index.values()];

      if (requests.length === 0) {
        console.log('No collection files found.');
        process.exit(0);
      }

      mkdirSync(outputDir, { recursive: true });

      if (opts.format === 'openapi') {
        const doc = exportToOpenAPI(requests);
        const outPath = join(outputDir, `${opts.filename}.yaml`);
        writeFileSync(outPath, yaml.dump(doc), 'utf8');
        console.log(`\x1b[32m✓\x1b[0m Exported ${requests.length} operation(s) to ${outPath}`);
      } else {
        console.error(`Unknown format: ${opts.format}. Supported: openapi`);
        process.exit(1);
      }
    });
}
