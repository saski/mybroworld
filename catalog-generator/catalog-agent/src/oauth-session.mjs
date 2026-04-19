import fs from 'node:fs/promises';
import { URLSearchParams } from 'node:url';

import { CatalogAgentError } from './errors.mjs';

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'openid',
  'email',
  'profile',
];

const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

async function readJsonFile(filePath, errorCode, messagePrefix) {
  let fileContents;
  try {
    fileContents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: errorCode,
      message: `${messagePrefix}: ${filePath}`,
    });
  }

  try {
    return JSON.parse(fileContents);
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: `${errorCode}_parse`,
      message: `${messagePrefix} is not valid JSON: ${filePath}`,
    });
  }
}

export async function readOAuthClientConfig(oauthClientPath) {
  const rawConfig = await readJsonFile(
    oauthClientPath,
    'oauth_client_read_failed',
    'Unable to read OAuth client file',
  );
  const clientConfig = rawConfig.installed || rawConfig.web || rawConfig;

  if (!clientConfig.client_id || !clientConfig.client_secret) {
    throw new CatalogAgentError({
      code: 'oauth_client_invalid',
      message: `OAuth client file is missing client_id or client_secret: ${oauthClientPath}`,
    });
  }

  return {
    clientId: clientConfig.client_id,
    clientSecret: clientConfig.client_secret,
    redirectUris: Array.isArray(clientConfig.redirect_uris) ? clientConfig.redirect_uris : [],
  };
}

async function readOAuthToken(oauthTokenPath) {
  const token = await readJsonFile(
    oauthTokenPath,
    'oauth_token_read_failed',
    'Unable to read OAuth token file',
  );

  if (!token.refresh_token) {
    throw new CatalogAgentError({
      code: 'oauth_token_invalid',
      message: `OAuth token file is missing refresh_token: ${oauthTokenPath}`,
    });
  }

  return token;
}

async function writeOAuthToken(oauthTokenPath, token) {
  await fs.writeFile(oauthTokenPath, `${JSON.stringify(token, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}

function tokenIsFresh(token) {
  return Number(token.expiry_date || 0) > Date.now() + 60_000 && token.access_token;
}

async function requestToken(formBody) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams(formBody),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  const responseText = await response.text();
  let payload = {};

  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: 'oauth_token_response_invalid',
      message: `OAuth token response could not be parsed: ${responseText}`,
    });
  }

  if (!response.ok) {
    throw new CatalogAgentError({
      code: 'oauth_token_exchange_failed',
      message: payload.error_description || payload.error || `OAuth token exchange failed with ${response.status}.`,
    });
  }

  return payload;
}

export function buildAuthorizationUrl({ clientConfig, redirectUri, scopes = GOOGLE_OAUTH_SCOPES, state }) {
  const url = new URL(GOOGLE_AUTHORIZATION_URL);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('client_id', clientConfig.clientId);
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  if (state) {
    url.searchParams.set('state', state);
  }

  return url.toString();
}

export async function exchangeAuthorizationCode({ clientConfig, code, redirectUri }) {
  const token = await requestToken({
    client_id: clientConfig.clientId,
    client_secret: clientConfig.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  return {
    ...token,
    expiry_date: Date.now() + (Number(token.expires_in || 0) * 1000),
  };
}

export class OAuthSession {
  constructor({ clientConfig, oauthTokenPath, token }) {
    this.clientConfig = clientConfig;
    this.oauthTokenPath = oauthTokenPath;
    this.token = token;
  }

  async getAccessToken(forceRefresh = false) {
    if (!forceRefresh && tokenIsFresh(this.token)) {
      return this.token.access_token;
    }

    const refreshedToken = await requestToken({
      client_id: this.clientConfig.clientId,
      client_secret: this.clientConfig.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: this.token.refresh_token,
    });

    this.token = {
      ...this.token,
      ...refreshedToken,
      expiry_date: Date.now() + (Number(refreshedToken.expires_in || 0) * 1000),
      refresh_token: refreshedToken.refresh_token || this.token.refresh_token,
    };
    await writeOAuthToken(this.oauthTokenPath, this.token);

    return this.token.access_token;
  }

  async authorizedFetch(url, init = {}) {
    const accessToken = await this.getAccessToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status !== 401) {
      return response;
    }

    const refreshedAccessToken = await this.getAccessToken(true);
    return fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${refreshedAccessToken}`,
      },
    });
  }

  async getIdentity() {
    const response = await this.authorizedFetch(GOOGLE_USERINFO_URL);
    if (!response.ok) {
      const responseText = await response.text();
      throw new CatalogAgentError({
        code: 'google_identity_read_failed',
        message: `Unable to read Google identity: ${response.status} ${responseText}`,
      });
    }

    return response.json();
  }
}

export async function loadOAuthSession({ oauthClientPath, oauthTokenPath }) {
  const [clientConfig, token] = await Promise.all([
    readOAuthClientConfig(oauthClientPath),
    readOAuthToken(oauthTokenPath),
  ]);

  return new OAuthSession({
    clientConfig,
    oauthTokenPath,
    token,
  });
}

export async function persistOAuthToken(oauthTokenPath, token) {
  await writeOAuthToken(oauthTokenPath, token);
}
