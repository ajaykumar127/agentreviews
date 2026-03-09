import { Connection } from 'jsforce';
import type { SalesforceSession } from './types';

interface OAuthTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
  error?: string;
  error_description?: string;
}

// Salesforce CLI's default Connected App - available in all orgs
const SF_CLI_CLIENT_ID = 'PlatformCLI';
const SF_CLI_REDIRECT_URI = 'http://localhost:1717/OauthRedirect';

export function getOAuthAuthorizeUrl(loginUrl: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SF_CLI_CLIENT_ID,
    redirect_uri: SF_CLI_REDIRECT_URI,
  });
  return `${loginUrl}/services/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForSession(
  code: string,
  loginUrl: string
): Promise<SalesforceSession> {
  const tokenUrl = `${loginUrl}/services/oauth2/token`;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: SF_CLI_CLIENT_ID,
    redirect_uri: SF_CLI_REDIRECT_URI,
    code,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data: OAuthTokenResponse = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  const idParts = data.id.split('/');
  const orgId = idParts[idParts.length - 2];
  const userId = idParts[idParts.length - 1];

  return {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
    apiVersion: '61.0',
    userId,
    orgId,
  };
}

export function getConnection(session: SalesforceSession): Connection {
  return new Connection({
    instanceUrl: session.instanceUrl,
    accessToken: session.accessToken,
    version: session.apiVersion,
  });
}

export function encryptSession(session: SalesforceSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

export function decryptSession(encoded: string): SalesforceSession {
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
}
