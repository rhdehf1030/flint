import type { CollectionRequest } from '../types/index.js';

interface PostmanItem {
  name?: string;
  request?: {
    method?: string;
    url?: string | { raw?: string; path?: string[] };
    header?: Array<{ key: string; value: string }>;
    body?: { mode?: string; raw?: string; urlencoded?: Array<{ key: string; value: string }> };
    description?: string;
  };
  item?: PostmanItem[];
}

export interface PostmanV21Collection {
  info?: { name?: string; description?: string };
  item?: PostmanItem[];
}

function extractItems(items: PostmanItem[]): PostmanItem[] {
  const result: PostmanItem[] = [];
  for (const item of items) {
    if (item.item) {
      result.push(...extractItems(item.item));
    } else if (item.request) {
      result.push(item);
    }
  }
  return result;
}

export function importFromPostmanV21(collection: PostmanV21Collection): CollectionRequest[] {
  const items = extractItems(collection.item ?? []);
  const results: CollectionRequest[] = [];

  for (const item of items) {
    const req = item.request;
    if (!req) continue;

    const method = (req.method ?? 'GET').toLowerCase();
    const rawUrl = typeof req.url === 'string' ? req.url : req.url?.raw ?? '';

    let path = '/';
    let serverUrl = '';
    try {
      const url = new URL(rawUrl);
      serverUrl = `${url.protocol}//${url.host}`;
      path = url.pathname || '/';
    } catch {
      path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    }

    const operationId = (item.name ?? `${method}-${path}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const operation: Record<string, unknown> = {
      operationId,
      summary: item.name,
      description: req.description,
      responses: { '200': { description: 'OK' } },
    };

    if (req.header && req.header.length > 0) {
      operation['parameters'] = req.header.map((h) => ({
        in: 'header',
        name: h.key,
        example: h.value,
        schema: { type: 'string' },
      }));
    }

    if (req.body?.raw) {
      try {
        const json = JSON.parse(req.body.raw);
        operation['requestBody'] = {
          content: {
            'application/json': {
              example: json,
            },
          },
        };
      } catch {
        operation['requestBody'] = {
          content: {
            'text/plain': { example: req.body.raw },
          },
        };
      }
    }

    results.push({
      openapi: '3.0.0',
      info: {
        title: collection.info?.name ?? 'Postman Import',
        version: '1.0.0',
        ...(collection.info?.description ? { description: collection.info.description } : {}),
      },
      ...(serverUrl ? { servers: [{ url: serverUrl }] } : {}),
      paths: {
        [path]: {
          [method]: operation as never,
        },
      },
    });
  }

  return results;
}
