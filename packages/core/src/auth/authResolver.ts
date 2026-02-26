import type { AuthProfile, EnvMap, RequestHeaders } from '../types/index.js';
import { interpolate } from '../env/variableInterpolator.js';

export async function resolveAuth(profile: AuthProfile, vars: EnvMap): Promise<RequestHeaders> {
  switch (profile.type) {
    case 'bearer': {
      const token = interpolate(profile.bearer!.token, vars, false);
      return { Authorization: `Bearer ${token}` };
    }
    case 'basic': {
      const username = interpolate(profile.basic!.username, vars, false);
      const password = interpolate(profile.basic!.password, vars, false);
      const encoded = Buffer.from(`${username}:${password}`).toString('base64');
      return { Authorization: `Basic ${encoded}` };
    }
    case 'api-key': {
      const key = interpolate(profile.apiKey!.key, vars, false);
      if (profile.apiKey!.headerName) {
        return { [profile.apiKey!.headerName]: key };
      }
      // query param style returns empty headers (caller must add to queryParams)
      return {};
    }
    case 'jwt': {
      const token = interpolate(profile.jwt!.token, vars, false);
      return { Authorization: `Bearer ${token}` };
    }
    case 'oauth2': {
      // OAuth2 tokens are resolved externally; expect token in vars
      const token = vars['ACCESS_TOKEN'] ?? '';
      return { Authorization: `Bearer ${token}` };
    }
    default:
      return {};
  }
}
