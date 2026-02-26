import { describe, it, expect } from 'vitest';

import { resolveAuth } from '../../src/auth/authResolver.js';
import { isJwtExpired } from '../../src/auth/jwtHandler.js';
import type { AuthProfile } from '../../src/types/index.js';

describe('resolveAuth', () => {
  it('generates Bearer token header', async () => {
    const profile: AuthProfile = { name: 'test', type: 'bearer', bearer: { token: 'my-token' } };
    const headers = await resolveAuth(profile, {});
    expect(headers['Authorization']).toBe('Bearer my-token');
  });

  it('interpolates token from vars', async () => {
    const profile: AuthProfile = {
      name: 'test',
      type: 'bearer',
      bearer: { token: '{{ACCESS_TOKEN}}' },
    };
    const headers = await resolveAuth(profile, { ACCESS_TOKEN: 'dynamic-token' });
    expect(headers['Authorization']).toBe('Bearer dynamic-token');
  });

  it('generates Basic auth header', async () => {
    const profile: AuthProfile = {
      name: 'test',
      type: 'basic',
      basic: { username: 'admin', password: 'secret' },
    };
    const headers = await resolveAuth(profile, {});
    const expected = `Basic ${Buffer.from('admin:secret').toString('base64')}`;
    expect(headers['Authorization']).toBe(expected);
  });

  it('generates API key header', async () => {
    const profile: AuthProfile = {
      name: 'test',
      type: 'api-key',
      apiKey: { key: 'my-api-key', headerName: 'X-API-Key' },
    };
    const headers = await resolveAuth(profile, {});
    expect(headers['X-API-Key']).toBe('my-api-key');
  });

  it('generates JWT Bearer header', async () => {
    const profile: AuthProfile = {
      name: 'test',
      type: 'jwt',
      jwt: { token: 'jwt-token' },
    };
    const headers = await resolveAuth(profile, {});
    expect(headers['Authorization']).toBe('Bearer jwt-token');
  });
});

describe('isJwtExpired', () => {
  function makeJwt(exp: number): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64');
    return `${header}.${payload}.signature`;
  }

  it('returns true for expired JWT', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    expect(isJwtExpired(makeJwt(pastExp))).toBe(true);
  });

  it('returns false for valid JWT', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    expect(isJwtExpired(makeJwt(futureExp))).toBe(false);
  });

  it('returns true for malformed token', () => {
    expect(isJwtExpired('not.a.jwt')).toBe(true);
  });

  it('returns false for JWT without exp claim', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64');
    const token = `${header}.${payload}.sig`;
    expect(isJwtExpired(token)).toBe(false);
  });
});
