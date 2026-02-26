import type { CollectionRequest, DocumentationOptions } from '../types/index.js';

export function generateMarkdown(
  collections: CollectionRequest[],
  options: DocumentationOptions = {},
): string {
  const title = options.title ?? 'API Documentation';
  const lines: string[] = [`# ${title}`, ''];

  if (collections.length === 0) {
    lines.push('*No collections found.*');
    return lines.join('\n');
  }

  for (const collection of collections) {
    for (const [path, methods] of Object.entries(collection.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        const op = operation as Record<string, unknown>;
        const operationId = op['operationId'] as string;
        const summary = op['summary'] as string | undefined;
        const description = op['description'] as string | undefined;

        lines.push(`## ${method.toUpperCase()} ${path}`);
        if (summary) lines.push(`**${summary}**`, '');
        if (description) lines.push(description, '');
        lines.push(`- **Operation ID:** \`${operationId}\``);

        const servers = collection.servers;
        if (servers?.[0]) {
          lines.push(`- **Base URL:** \`${servers[0].url}\``);
        }

        lines.push('');

        if (options.includeAssertions) {
          const xFlint = op['x-flint'] as Record<string, unknown> | undefined;
          const assertions = xFlint?.['assertions'];
          if (assertions && Array.isArray(assertions) && assertions.length > 0) {
            lines.push('### Assertions', '');
            lines.push('```yaml');
            for (const rule of assertions) {
              lines.push(JSON.stringify(rule));
            }
            lines.push('```', '');
          }
        }

        if (options.includeSchemas) {
          const requestBody = op['requestBody'] as Record<string, unknown> | undefined;
          if (requestBody) {
            lines.push('### Request Body', '');
            lines.push('```json');
            lines.push(JSON.stringify(requestBody, null, 2));
            lines.push('```', '');
          }
        }

        lines.push('---', '');
      }
    }
  }

  return lines.join('\n');
}
