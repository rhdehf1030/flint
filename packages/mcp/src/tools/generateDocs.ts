import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildCollectionIndex, generateMarkdown, generateHtml } from '@flint/core';

export function registerGenerateDocs(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'generate_docs',
    'Generate API documentation from workspace collections',
    {
      format: z.enum(['markdown', 'html']).optional().describe('Output format (default: markdown)'),
      outputDir: z.string().optional().describe('Output directory (default: ./docs in workspaceRoot)'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const format = args.format ?? 'markdown';
      const outputDir = resolve(ws, args.outputDir ?? 'docs');
      const collectionsDir = resolve(ws, 'collections');

      const index = buildCollectionIndex(collectionsDir);
      const collections = [...index.values()];

      if (collections.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No collections found.' }],
        };
      }

      mkdirSync(outputDir, { recursive: true });

      const docOptions = { includeExamples: false, includeAssertions: true, includeSchemas: true };
      let filePath: string;

      if (format === 'html') {
        const content = generateHtml(collections, docOptions);
        filePath = join(outputDir, 'api.html');
        writeFileSync(filePath, content, 'utf8');
      } else {
        const content = generateMarkdown(collections, docOptions);
        filePath = join(outputDir, 'api.md');
        writeFileSync(filePath, content, 'utf8');
      }

      return {
        content: [{ type: 'text' as const, text: `Generated ${format} documentation: ${filePath}` }],
      };
    },
  );
}
