import { query } from './client';
import { encryptToString, decryptFromString } from '../crypto/encryption';

export interface SavedCredential {
  id: string;
  profileName: string;
  loginUrl: string;
  username: string;
  authMethod: 'oauth' | 'direct';
  lastUsed: Date | null;
  createdAt: Date;
}

export interface CredentialWithPassword extends SavedCredential {
  password: string;
  securityToken?: string;
}

export async function listCredentials(userId?: string): Promise<SavedCredential[]> {
  const sql = `
    SELECT id, profile_name, login_url, username, auth_method, last_used, created_at
    FROM saved_credentials
    WHERE user_id IS NULL OR user_id = $1
    ORDER BY last_used DESC NULLS LAST, created_at DESC
  `;

  const result = await query(sql, [userId || null]);

  return result.rows.map((row) => ({
    id: row.id,
    profileName: row.profile_name,
    loginUrl: row.login_url,
    username: row.username,
    authMethod: row.auth_method,
    lastUsed: row.last_used,
    createdAt: row.created_at,
  }));
}

export async function saveCredential(
  profileName: string,
  loginUrl: string,
  username: string,
  password: string,
  securityToken: string | null,
  authMethod: 'oauth' | 'direct',
  userId?: string
): Promise<string> {
  const passwordEnc = encryptToString(password);
  const tokenEnc = securityToken ? encryptToString(securityToken) : null;

  const sql = `
    INSERT INTO saved_credentials (
      profile_name, login_url, username, password_encrypted, security_token_encrypted,
      password_iv, token_iv, auth_method, user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (profile_name, user_id)
    DO UPDATE SET
      login_url = EXCLUDED.login_url,
      username = EXCLUDED.username,
      password_encrypted = EXCLUDED.password_encrypted,
      security_token_encrypted = EXCLUDED.security_token_encrypted,
      password_iv = EXCLUDED.password_iv,
      token_iv = EXCLUDED.token_iv,
      auth_method = EXCLUDED.auth_method,
      updated_at = NOW()
    RETURNING id
  `;

  const result = await query(sql, [
    profileName,
    loginUrl,
    username,
    passwordEnc.combined,
    tokenEnc?.combined || null,
    passwordEnc.iv,
    tokenEnc?.iv || null,
    authMethod,
    userId || null,
  ]);

  return result.rows[0].id;
}

export async function getCredential(id: string): Promise<CredentialWithPassword | null> {
  const sql = `
    SELECT id, profile_name, login_url, username, password_encrypted, security_token_encrypted,
           password_iv, token_iv, auth_method, last_used, created_at
    FROM saved_credentials
    WHERE id = $1
  `;

  const result = await query(sql, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  const password = decryptFromString(row.password_encrypted, row.password_iv);

  let securityToken: string | undefined;
  if (row.security_token_encrypted && row.token_iv) {
    securityToken = decryptFromString(row.security_token_encrypted, row.token_iv);
  }

  return {
    id: row.id,
    profileName: row.profile_name,
    loginUrl: row.login_url,
    username: row.username,
    password,
    securityToken,
    authMethod: row.auth_method,
    lastUsed: row.last_used,
    createdAt: row.created_at,
  };
}

export async function updateLastUsed(id: string): Promise<void> {
  const sql = `UPDATE saved_credentials SET last_used = NOW() WHERE id = $1`;
  await query(sql, [id]);
}

export async function deleteCredential(id: string): Promise<void> {
  const sql = `DELETE FROM saved_credentials WHERE id = $1`;
  await query(sql, [id]);
}
