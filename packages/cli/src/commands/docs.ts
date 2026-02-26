import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

import type { Command } from 'commander';
import { buildCollectionIndex, generateMarkdown, generateHtml } from '@flint/core';

export function registerDocsCommand(program: Command): void {
  program
    .command('docs')
    .description('Generate API documentation from collections')
    .option('-o, --output <dir>', 'output directory', './docs')
    .option('-f, --format <fmt>', 'output format (markdown|html)', 'markdown')
    .option('-c, --collections <dir>', 'collections directory', './collections')
    .option('--include-examples', 'include request/response examples', false)
    .option('--include-assertions', 'include assertion rules', false)
    .option('--include-schemas', 'include JSON schemas', false)
    .option('--title <title>', 'documentation title', 'API Documentation')
    .action((opts: {
      output: string;
      format: string;
      collections: string;
      includeExamples: boolean;
      includeAssertions: boolean;
      includeSchemas: boolean;
      title: string;
    }) => {
      const collectionsDir = resolve(opts.collections);
      const outputDir = resolve(opts.output);

      const index = buildCollectionIndex(collectionsDir);
      const collections = [...index.values()];

      if (collections.length === 0) {
        console.log('No collection files found.');
        process.exit(0);
      }

      const docOptions = {
        includeExamples: opts.includeExamples,
        includeAssertions: opts.includeAssertions,
        includeSchemas: opts.includeSchemas,
        title: opts.title,
      };

      mkdirSync(outputDir, { recursive: true });

      if (opts.format === 'markdown') {
        const content = generateMarkdown(collections, docOptions);
        const outPath = join(outputDir, 'api.md');
        writeFileSync(outPath, content, 'utf8');
        console.log(`\x1b[32m✓\x1b[0m Generated ${outPath} (${collections.length} operations)`);
      } else if (opts.format === 'html') {
        const content = generateHtml(collections, docOptions);
        const outPath = join(outputDir, 'api.html');
        writeFileSync(outPath, content, 'utf8');
        console.log(`\x1b[32m✓\x1b[0m Generated ${outPath} (${collections.length} operations)`);
      } else {
        console.error(`Unknown format: ${opts.format}. Supported: markdown, html`);
        process.exit(1);
      }
    });
}
