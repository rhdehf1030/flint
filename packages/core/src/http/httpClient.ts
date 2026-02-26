import { request as undiciRequest } from 'undici';

import type { HttpRequest, HttpResponse, RequestBody } from '../types/index.js';

function buildBody(body: RequestBody): { body: string | FormData | URLSearchParams | null; contentType?: string } {
  switch (body.type) {
    case 'json':
      return {
        body: body.json !== undefined ? JSON.stringify(body.json) : null,
        contentType: 'application/json',
      };
    case 'form-data': {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(body.formData ?? {})) {
        params.append(k, v);
      }
      return { body: params, contentType: 'application/x-www-form-urlencoded' };
    }
    case 'multipart': {
      const form = new FormData();
      for (const [k, v] of Object.entries(body.multipart ?? {})) {
        form.append(k, v);
      }
      return { body: form };
    }
    case 'raw':
      return { body: body.raw ?? null };
    case 'none':
    default:
      return { body: null };
  }
}

function buildUrl(baseUrl: string, queryParams: Record<string, string | string[]>): string {
  const entries = Object.entries(queryParams);
  if (entries.length === 0) return baseUrl;

  const url = new URL(baseUrl);
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const v of value) {
        url.searchParams.append(key, v);
      }
    } else {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function executeRequest(request: HttpRequest): Promise<HttpResponse> {
  const { method, headers, body: requestBody, timeoutMs = 30000 } = request;

  const { body: bodyData, contentType } = buildBody(requestBody);
  const mergedHeaders: Record<string, string> = { ...headers };
  if (contentType && !mergedHeaders['content-type'] && !mergedHeaders['Content-Type']) {
    mergedHeaders['content-type'] = contentType;
  }

  const url = buildUrl(request.url, request.queryParams);

  const startTime = Date.now();

  try {
    const response = await undiciRequest(url, {
      method,
      headers: mergedHeaders,
      body: bodyData as string | null,
      headersTimeout: timeoutMs,
      bodyTimeout: timeoutMs,
    });

    const responseTimeMs = Date.now() - startTime;
    const rawBody = await response.body.text();

    // Normalize headers to lowercase keys with string values
    const responseHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(response.headers)) {
      responseHeaders[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : (v ?? '');
    }

    let parsedBody: unknown = rawBody;
    const contentTypeHeader = responseHeaders['content-type'] ?? '';
    if (contentTypeHeader.includes('application/json') && rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = rawBody;
      }
    }

    return {
      status: response.statusCode,
      headers: responseHeaders,
      body: parsedBody,
      rawBody,
      responseTimeMs,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - startTime;
    // Re-throw non-HTTP errors (network errors, timeouts)
    throw Object.assign(err as Error, { responseTimeMs });
  }
}
