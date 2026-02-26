export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type BodyType = 'json' | 'form-data' | 'multipart' | 'raw' | 'none';

export interface RequestHeaders {
  [key: string]: string;
}

export interface QueryParams {
  [key: string]: string | string[];
}

export interface RequestBody {
  type: BodyType;
  json?: unknown;
  formData?: Record<string, string>;
  multipart?: Record<string, string>;
  raw?: string;
}

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers: RequestHeaders;
  queryParams: QueryParams;
  body: RequestBody;
  timeoutMs?: number;
  followRedirects?: boolean;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  rawBody: string;
  responseTimeMs: number;
}
