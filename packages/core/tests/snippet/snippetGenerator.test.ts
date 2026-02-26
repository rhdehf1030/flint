import { describe, it, expect } from 'vitest';

import { generateCodeSnippet } from '../../src/snippet/snippetGenerator.js';
import type { HttpRequest } from '../../src/types/index.js';

function makeGetRequest(): HttpRequest {
  return {
    method: 'GET',
    url: 'https://api.example.com/users',
    headers: { Authorization: 'Bearer token123' },
    queryParams: { page: '1', limit: '10' },
    body: { type: 'none' },
    timeoutMs: 30000,
    followRedirects: true,
  };
}

function makePostRequest(): HttpRequest {
  return {
    method: 'POST',
    url: 'https://api.example.com/users',
    headers: { 'content-type': 'application/json' },
    queryParams: {},
    body: { type: 'json', json: { name: 'Alice', email: 'alice@example.com' } },
    timeoutMs: 30000,
    followRedirects: true,
  };
}

describe('generateCodeSnippet', () => {
  describe('curl', () => {
    it('generates GET request with headers and query params', () => {
      const snippet = generateCodeSnippet(makeGetRequest(), 'curl');
      expect(snippet.language).toBe('bash');
      expect(snippet.code).toContain('curl -X GET');
      expect(snippet.code).toContain('api.example.com/users');
      expect(snippet.code).toContain('page=1');
      expect(snippet.code).toContain('Authorization');
    });

    it('generates POST with JSON body', () => {
      const snippet = generateCodeSnippet(makePostRequest(), 'curl');
      expect(snippet.code).toContain('-X POST');
      expect(snippet.code).toContain('-d');
      expect(snippet.code).toContain('Alice');
    });
  });

  describe('fetch', () => {
    it('generates GET request', () => {
      const snippet = generateCodeSnippet(makeGetRequest(), 'fetch');
      expect(snippet.language).toBe('javascript');
      expect(snippet.code).toContain("method: 'GET'");
      expect(snippet.code).toContain('fetch(');
    });

    it('generates POST with JSON body', () => {
      const snippet = generateCodeSnippet(makePostRequest(), 'fetch');
      expect(snippet.code).toContain("method: 'POST'");
      expect(snippet.code).toContain('JSON.stringify');
    });
  });

  describe('axios', () => {
    it('generates axios call', () => {
      const snippet = generateCodeSnippet(makePostRequest(), 'axios');
      expect(snippet.language).toBe('javascript');
      expect(snippet.code).toContain("method: 'post'");
      expect(snippet.code).toContain('axios(');
    });
  });

  describe('python-requests', () => {
    it('generates python requests code', () => {
      const snippet = generateCodeSnippet(makeGetRequest(), 'python-requests');
      expect(snippet.language).toBe('python');
      expect(snippet.code).toContain('import requests');
      expect(snippet.code).toContain('requests.get');
    });
  });

  describe('go-http', () => {
    it('generates Go net/http code', () => {
      const snippet = generateCodeSnippet(makeGetRequest(), 'go-http');
      expect(snippet.language).toBe('go');
      expect(snippet.code).toContain('net/http');
      expect(snippet.code).toContain('http.NewRequest');
    });
  });

  describe('httpie', () => {
    it('generates HTTPie command', () => {
      const snippet = generateCodeSnippet(makeGetRequest(), 'httpie');
      expect(snippet.language).toBe('bash');
      expect(snippet.code).toContain('http GET');
      expect(snippet.code).toContain('api.example.com');
    });
  });
});
