#!/usr/bin/env node
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { loadAgentConfig } from './config.mjs';
import { normalizeAgentError } from './errors.mjs';
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  OAuthSession,
  persistOAuthToken,
  readOAuthClientConfig,
} from './oauth-session.mjs';

function parseArgs(argv) {
  return argv.reduce((args, token, index) => {
    if (!token.startsWith('--')) {
      return args;
    }

    const nextToken = argv[index + 1];
    args[token.slice(2)] = nextToken && !nextToken.startsWith('--') ? nextToken : 'true';
    return args;
  }, {});
}

function resolveRedirectUri(clientConfig, override) {
  if (override) {
    return override;
  }

  const loopbackRedirect = clientConfig.redirectUris.find((redirectUri) => /^https?:\/\/(localhost|127\.0\.0\.1)/.test(redirectUri));
  if (!loopbackRedirect) {
    return 'http://127.0.0.1:53682/oauth2callback';
  }

  const parsed = new URL(loopbackRedirect);
  if (parsed.port) {
    return loopbackRedirect;
  }

  parsed.port = '53682';
  if (!parsed.pathname || parsed.pathname === '/') {
    parsed.pathname = '/oauth2callback';
  }

  return parsed.toString();
}

function waitForAuthorizationCode({ redirectUri, expectedState, timeoutMs = 300000 }) {
  const redirectUrl = new URL(redirectUri);

  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      try {
        const requestUrl = new URL(request.url, redirectUri);
        const code = requestUrl.searchParams.get('code');
        const state = requestUrl.searchParams.get('state');
        const error = requestUrl.searchParams.get('error');

        if (requestUrl.pathname !== redirectUrl.pathname) {
          response.writeHead(404);
          response.end('Not found.');
          return;
        }

        if (error) {
          response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end(`Authorization failed: ${error}`);
          clearTimeout(timeoutHandle);
          server.close(() => reject(new Error(`Authorization failed: ${error}`)));
          return;
        }

        if (!code || state !== expectedState) {
          response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Invalid authorization response.');
          return;
        }

        response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Authorization completed. You can close this tab.');
        clearTimeout(timeoutHandle);
        server.close(() => resolve(code));
      } catch (error) {
        clearTimeout(timeoutHandle);
        server.close(() => reject(error));
      }
    });

    const timeoutHandle = setTimeout(() => {
      server.close(() => reject(new Error('Timed out waiting for OAuth authorization.')));
    }, timeoutMs);

    server.listen(Number(redirectUrl.port), redirectUrl.hostname);
  });
}

const args = parseArgs(process.argv.slice(2));

try {
  const config = await loadAgentConfig(args.config);
  const clientConfig = await readOAuthClientConfig(config.oauthClientPath);
  const redirectUri = resolveRedirectUri(clientConfig, args['redirect-uri']);
  const oauthState = randomUUID();
  const authorizationUrl = buildAuthorizationUrl({
    clientConfig,
    redirectUri,
    state: oauthState,
  });

  console.log('[catalog-agent] open the following URL in the browser session for the configured Google account:');
  console.log(authorizationUrl);
  console.log(`[catalog-agent] waiting for redirect on ${redirectUri}`);

  const authorizationCode = await waitForAuthorizationCode({
    expectedState: oauthState,
    redirectUri,
  });
  const token = await exchangeAuthorizationCode({
    clientConfig,
    code: authorizationCode,
    redirectUri,
  });

  await fs.mkdir(path.dirname(config.oauthTokenPath), { recursive: true });
  await persistOAuthToken(config.oauthTokenPath, token);

  const oauthSession = new OAuthSession({
    clientConfig,
    oauthTokenPath: config.oauthTokenPath,
    token,
  });
  const identity = await oauthSession.getIdentity();
  console.log(`[catalog-agent] stored OAuth token for ${identity.email || '<unknown>'}`);
} catch (error) {
  const normalizedError = normalizeAgentError(error, 'catalog_agent_authorize_failed');
  console.error(`[catalog-agent] failed code=${normalizedError.code} message=${normalizedError.message}`);
  process.exit(1);
}
