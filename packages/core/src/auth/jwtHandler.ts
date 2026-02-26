import type { EnvMap, JwtConfig } from '../types/index.js';
import { interpolate } from '../env/variableInterpolator.js';

export function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')) as Record<string, unknown>;
    if (typeof payload['exp'] !== 'number') return false;

    return Date.now() / 1000 > payload['exp'];
  } catch {
    return true;
  }
}

export async function refreshJwt(config: JwtConfig, vars: EnvMap): Promise<string> {
  if (!config.refreshUrl || !config.refreshToken) {
    throw new Error('refreshUrl and refreshToken are required for JWT refresh');
  }

  const refreshToken = interpolate(config.refreshToken, vars, false);
  const { request: undiciRequest } = await import('undici');

  const response = await undiciRequest(config.refreshUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const body = await response.body.json() as Record<string, unknown>;

  if (typeof body['access_token'] !== 'string') {
    throw new Error('JWT refresh response missing access_token');
  }

  return body['access_token'];
}
