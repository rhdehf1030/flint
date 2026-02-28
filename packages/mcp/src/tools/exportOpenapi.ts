import { resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import yaml from 'js-yaml';
import { buildCollectionIndex, buildCollections, exportToOpenAPI } from '@flint/core';

export function registerExportOpenapi(server: McpServer, workspaceRef: { root: string }): void {
  server.tool(
    'export_openapi',
    'Export workspace collections to a merged OpenAPI 3.x spec file',
    {
      collection: z.string().optional().describe('Export only this collection folder (e.g. "users-api"). Omit to export all collections.'),
      outputPath: z.string().optional().describe('Output file path (relative to workspaceRoot or absolute). Defaults to openapi.yaml in workspaceRoot.'),
      workspaceRoot: z.string().optional().describe('Workspace root directory (overrides server default)'),
    },
    (args) => {
      const ws = args.workspaceRoot ?? workspaceRef.root;
      const collectionsDir = resolve(ws, 'collections');

      let requests;
      if (args.collection) {
        const folderDir = resolve(collectionsDir, args.collection);
        const index = buildCollectionIndex(folderDir);
        requests = [...index.values()];
      } else {
        const collections = buildCollections(collectionsDir);
        requests = collections.flatMap((c) => c.requests);
      }

      if (requests.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No requests found to export.' }],
        };
      }

      const spec = exportToOpenAPI(requests);
      const outputPath = args.outputPath
        ? resolve(ws, args.outputPath)
        : resolve(ws, 'openapi.yaml');

      mkdirSync(resolve(outputPath, '..'), { recursive: true });
      writeFileSync(outputPath, yaml.dump(spec), 'utf8');

      return {
        content: [{ type: 'text' as const, text: `Exported ${requests.length} operations to: ${outputPath}` }],
      };
    },
  );
}
