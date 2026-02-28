import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import yaml from 'js-yaml';
import { importFromOpenAPI } from '@flint/core';

type OpenAPIDoc = { info?: { title?: string; version?: string }; paths?: Record<string, unknown>; servers?: unknown[] };

export function registerImportOpenapi(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'import_openapi',
    'Import an OpenAPI 3.x spec and create collection request files for each operation',
    {
      spec: z.string().describe('OpenAPI 3.x spec as JSON or YAML string'),
      collection: z.string().optional().describe('Collection folder name under collections/ (e.g. "users-api"). Defaults to the spec title slugified.'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;

      let specObj: OpenAPIDoc;
      try {
        specObj = JSON.parse(args.spec) as OpenAPIDoc;
      } catch {
        specObj = yaml.load(args.spec) as OpenAPIDoc;
      }

      const requests = importFromOpenAPI(specObj as Parameters<typeof importFromOpenAPI>[0]);
      const folderName = args.collection ??
        (specObj.info?.title ?? 'imported').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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
          text: `Imported ${created.length} operations to ${collectionsDir}:\n${created.map((f) => `  - ${f}`).join('\n')}`,
        }],
      };
    },
  );
}
