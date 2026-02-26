import type { CollectionRequest, DocumentationOptions } from '../types/index.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateHtml(
  collections: CollectionRequest[],
  options: DocumentationOptions = {},
): string {
  const title = escapeHtml(options.title ?? 'API Documentation');

  const sections: string[] = [];

  for (const collection of collections) {
    for (const [path, methods] of Object.entries(collection.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        const op = operation as Record<string, unknown>;
        const operationId = escapeHtml(op['operationId'] as string);
        const summary = op['summary'] ? escapeHtml(op['summary'] as string) : '';
        const description = op['description'] ? escapeHtml(op['description'] as string) : '';

        const methodColors: Record<string, string> = {
          get: 'success', post: 'primary', put: 'warning',
          patch: 'info', delete: 'danger', head: 'secondary', options: 'light',
        };
        const badgeColor = methodColors[method.toLowerCase()] ?? 'secondary';

        sections.push(`
          <div class="card mb-3">
            <div class="card-header">
              <span class="badge bg-${badgeColor} me-2">${method.toUpperCase()}</span>
              <code>${escapeHtml(path)}</code>
              ${summary ? `<span class="ms-2 text-muted">${summary}</span>` : ''}
            </div>
            <div class="card-body">
              <p><strong>Operation ID:</strong> <code>${operationId}</code></p>
              ${description ? `<p>${description}</p>` : ''}
            </div>
          </div>`);
      }
    }
  }

  const body = collections.length === 0
    ? '<p class="text-muted">No collections found.</p>'
    : sections.join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body>
  <div class="container py-4">
    <h1 class="mb-4">${title}</h1>
    ${body}
  </div>
</body>
</html>`;
}
