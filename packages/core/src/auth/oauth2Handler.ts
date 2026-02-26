import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';

import type { OAuth2Config } from '../types/index.js';

function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export async function startOAuth2Flow(config: OAuth2Config): Promise<string> {
  const redirectUri = config.redirectUri ?? 'http://localhost:9876/callback';
  const port = parseInt(new URL(redirectUri).port || '9876', 10);

  const state = randomBytes(16).toString('hex');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const authUrl = new URL(config.authorizationUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', config.scopes.join(' '));
  authUrl.searchParams.set('state', state);

  if (config.usePkce !== false) {
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
  }

  // Wait for callback
  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`);
      const receivedState = url.searchParams.get('state');
      const receivedCode = url.searchParams.get('code');

      if (receivedState !== state) {
        res.writeHead(400);
        res.end('Invalid state');
        server.close();
        reject(new Error('OAuth2 state mismatch'));
        return;
      }

      if (!receivedCode) {
        res.writeHead(400);
        res.end('Missing code');
        server.close();
        reject(new Error('OAuth2 missing authorization code'));
        return;
      }

      res.writeHead(200);
      res.end('Authorization successful! You may close this window.');
      server.close();
      resolve(receivedCode);
    });

    server.listen(port);
    console.log(`Open this URL in your browser:\n${authUrl.toString()}`);
  });

  // Exchange code for token
  const { request: undiciRequest } = await import('undici');
  const tokenParams: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
  };

  if (config.usePkce !== false) {
    tokenParams['code_verifier'] = codeVerifier;
  } else if (config.clientSecret) {
    tokenParams['client_secret'] = config.clientSecret;
  }

  const response = await undiciRequest(config.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(tokenParams).toString(),
  });

  const body = await response.body.json() as Record<string, unknown>;
  if (typeof body['access_token'] !== 'string') {
    throw new Error(`OAuth2 token exchange failed: ${JSON.stringify(body)}`);
  }

  return body['access_token'];
}
