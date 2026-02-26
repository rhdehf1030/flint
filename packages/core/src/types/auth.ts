export type AuthType = 'oauth2' | 'jwt' | 'api-key' | 'basic' | 'bearer';

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  redirectUri?: string;
  usePkce?: boolean;
}

export interface JwtConfig {
  token: string;
  refreshToken?: string;
  refreshUrl?: string;
  expiresAt?: string;
}

export interface ApiKeyConfig {
  key: string;
  headerName?: string;
  queryParam?: string;
}

export interface BasicAuthConfig {
  username: string;
  password: string;
}

export interface BearerConfig {
  token: string;
}

export interface AuthProfile {
  name: string;
  type: AuthType;
  oauth2?: OAuth2Config;
  jwt?: JwtConfig;
  apiKey?: ApiKeyConfig;
  basic?: BasicAuthConfig;
  bearer?: BearerConfig;
}
