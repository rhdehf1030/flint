import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import yaml from 'js-yaml';
import { importFromPostmanV21 } from '@flint/core';
import type { PostmanV21Collection } from '@flint/core';

export function registerImportPostman(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'import_postman',
    'Import a Postman v2.1 collection and create collection request files for each request',
    {
      collection: z.string().describe('Postman v2.1 collection as a JSON string'),
      folder: z.string().optional().describe('Collection folder name under collections/. Defaults to the Postman collection name slugified.'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const postman = JSON.parse(args.collection) as PostmanV21Collection;
      const requests = importFromPostmanV21(postman);

      const folderName = args.folder ??
        (postman.info?.name ?? 'postman-import').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const collectionsDir = resolve(ws, 'collections', folderName);
      mkdirSync(collectionsDir, { recursive: true });

      const created: string[] = [];
      for (const req of requests) {
        const firstPath = Object.values(req.paths)[0];
        const firstOp = firstPath ? Object.values(firstPath)[0] as Record<string, unknown> : undefined;
        const operationId = (firstOp?.['operationId'] as string) ?? 'operation';
        const filePath = join(collectionsDir, `${operationId}.yaml`);
        writeFileSync(filePath, yaml.dump(req), 'utf8');
        created.push(filePath);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `Imported ${created.length} requests to ${collectionsDir}:\n${created.map((f) => `  - ${f}`).join('\n')}`,
        }],
      };
    },
  );
}
