import type { CodeSnippet, HttpRequest, SnippetTarget } from '../types/index.js';

function escapeShell(value: string): string {
  return value.replace(/'/g, "'\\''");
}

function escapeJs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function buildQueryString(queryParams: Record<string, string | string[]>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(queryParams)) {
    if (Array.isArray(v)) {
      v.forEach((val) => params.append(k, val));
    } else {
      params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function generateCurl(request: HttpRequest): string {
  const qs = buildQueryString(request.queryParams);
  const url = `${request.url}${qs}`;
  const lines: string[] = [`curl -X ${request.method} '${escapeShell(url)}'`];

  for (const [k, v] of Object.entries(request.headers)) {
    lines.push(`  -H '${escapeShell(k)}: ${escapeShell(v)}'`);
  }

  if (request.body.type === 'json' && request.body.json !== undefined) {
    lines.push(`  -d '${escapeShell(JSON.stringify(request.body.json))}'`);
  } else if (request.body.type === 'raw' && request.body.raw) {
    lines.push(`  -d '${escapeShell(request.body.raw)}'`);
  } else if (request.body.type === 'form-data' && request.body.formData) {
    for (const [k, v] of Object.entries(request.body.formData)) {
      lines.push(`  --data-urlencode '${escapeShell(k)}=${escapeShell(v)}'`);
    }
  }

  return lines.join(' \\\n');
}

function generateFetch(request: HttpRequest): string {
  const qs = buildQueryString(request.queryParams);
  const url = `${request.url}${qs}`;
  const lines: string[] = [`fetch('${escapeJs(url)}', {`];
  lines.push(`  method: '${request.method}',`);

  if (Object.keys(request.headers).length > 0) {
    lines.push('  headers: {');
    for (const [k, v] of Object.entries(request.headers)) {
      lines.push(`    '${escapeJs(k)}': '${escapeJs(v)}',`);
    }
    lines.push('  },');
  }

  if (request.body.type === 'json' && request.body.json !== undefined) {
    lines.push(`  body: JSON.stringify(${JSON.stringify(request.body.json, null, 2)}),`);
  } else if (request.body.type === 'raw' && request.body.raw) {
    lines.push(`  body: '${escapeJs(request.body.raw)}',`);
  }

  lines.push('});');
  return lines.join('\n');
}

function generateAxios(request: HttpRequest): string {
  const qs = buildQueryString(request.queryParams);
  const url = `${request.url}${qs}`;
  const lines: string[] = [`axios({`];
  lines.push(`  method: '${request.method.toLowerCase()}',`);
  lines.push(`  url: '${escapeJs(url)}',`);

  if (Object.keys(request.headers).length > 0) {
    lines.push('  headers: {');
    for (const [k, v] of Object.entries(request.headers)) {
      lines.push(`    '${escapeJs(k)}': '${escapeJs(v)}',`);
    }
    lines.push('  },');
  }

  if (request.body.type === 'json' && request.body.json !== undefined) {
    lines.push(`  data: ${JSON.stringify(request.body.json, null, 2)},`);
  }

  lines.push('});');
  return lines.join('\n');
}

function generatePythonRequests(request: HttpRequest): string {
  const qs = buildQueryString(request.queryParams);
  const url = `${request.url}${qs}`;
  const lines: string[] = ['import requests', ''];
  lines.push(`url = '${url}'`);

  if (Object.keys(request.headers).length > 0) {
    lines.push('headers = {');
    for (const [k, v] of Object.entries(request.headers)) {
      lines.push(`    '${k}': '${v}',`);
    }
    lines.push('}');
  } else {
    lines.push('headers = {}');
  }

  if (request.body.type === 'json' && request.body.json !== undefined) {
    lines.push(`json = ${JSON.stringify(request.body.json, null, 4)}`);
    lines.push(`response = requests.${request.method.toLowerCase()}(url, headers=headers, json=json)`);
  } else {
    lines.push(`response = requests.${request.method.toLowerCase()}(url, headers=headers)`);
  }

  lines.push('print(response.json())');
  return lines.join('\n');
}

function generateGoHttp(request: HttpRequest): string {
  const qs = buildQueryString(request.queryParams);
  const url = `${request.url}${qs}`;
  const lines: string[] = [
    'package main',
    '',
    'import (',
    '    "bytes"',
    '    "encoding/json"',
    '    "fmt"',
    '    "net/http"',
    ')',
    '',
    'func main() {',
  ];

  if (request.body.type === 'json' && request.body.json !== undefined) {
    lines.push(`    body, _ := json.Marshal(${JSON.stringify(request.body.json)})`);
    lines.push(`    req, _ := http.NewRequest("${request.method}", "${url}", bytes.NewBuffer(body))`);
  } else {
    lines.push(`    req, _ := http.NewRequest("${request.method}", "${url}", nil)`);
  }

  for (const [k, v] of Object.entries(request.headers)) {
    lines.push(`    req.Header.Set("${k}", "${v}")`);
  }

  lines.push('    client := &http.Client{}');
  lines.push('    resp, _ := client.Do(req)');
  lines.push('    defer resp.Body.Close()');
  lines.push('    fmt.Println(resp.Status)');
  lines.push('}');

  return lines.join('\n');
}

function generateHttpie(request: HttpRequest): string {
  const qs = buildQueryString(request.queryParams);
  const url = `${request.url}${qs}`;
  const parts: string[] = ['http', request.method.toUpperCase(), `'${escapeShell(url)}'`];

  for (const [k, v] of Object.entries(request.headers)) {
    parts.push(`'${escapeShell(k)}:${escapeShell(v)}'`);
  }

  if (request.body.type === 'json' && request.body.json !== undefined) {
    const body = request.body.json as Record<string, unknown>;
    if (typeof body === 'object' && body !== null) {
      for (const [k, v] of Object.entries(body)) {
        parts.push(`'${k}=${JSON.stringify(v)}'`);
      }
    }
  }

  return parts.join(' ');
}

export function generateCodeSnippet(request: HttpRequest, target: SnippetTarget): CodeSnippet {
  let code: string;
  let language: string;

  switch (target) {
    case 'curl':
      code = generateCurl(request);
      language = 'bash';
      break;
    case 'fetch':
      code = generateFetch(request);
      language = 'javascript';
      break;
    case 'axios':
      code = generateAxios(request);
      language = 'javascript';
      break;
    case 'python-requests':
      code = generatePythonRequests(request);
      language = 'python';
      break;
    case 'go-http':
      code = generateGoHttp(request);
      language = 'go';
      break;
    case 'httpie':
      code = generateHttpie(request);
      language = 'bash';
      break;
  }

  return { target, language, code };
}
