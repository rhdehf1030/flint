import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import yaml from 'js-yaml';
import { parseCollectionContent } from '@flint/core';

export function registerCreateRequest(server: McpServer, workspaceRoot: string): void {
  server.tool(
    'create_request',
    'Create a new collection request file from an OpenAPI 3.x spec object',
    {
      spec: z.string().describe('OpenAPI 3.x collection request as a JSON string'),
    },
    (args) => {
      const specObj = JSON.parse(args.spec) as Record<string, unknown>;

      // Validate using parseCollectionContent
      const yamlStr = yaml.dump(specObj);
      const collection = parseCollectionContent(yamlStr);

      // Extract operationId from the first operation
      const paths = collection.paths;
      const firstPath = Object.values(paths)[0];
      const firstMethod = firstPath ? Object.values(firstPath)[0] as Record<string, unknown> : undefined;
      const operationId = firstMethod?.['operationId'] as string ?? 'operation';

      const collectionsDir = resolve(workspaceRoot, 'collections');
      mkdirSync(collectionsDir, { recursive: true });

      const filePath = join(collectionsDir, `${operationId}.yaml`);
      writeFileSync(filePath, yaml.dump(collection), 'utf8');

      return {
        content: [{ type: 'text' as const, text: `Created: ${filePath}` }],
      };
    },
  );
}
