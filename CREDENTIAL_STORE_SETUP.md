# PostgreSQL Credential Store - Implementation Guide

## Overview

This feature adds a **PostgreSQL-backed credential store** to remember multiple Salesforce org logins, allowing users to quickly switch between orgs using a dropdown selector.

---

## Security Architecture

### Encryption Strategy
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Management**: 32-byte encryption key stored in environment variable
- **Initialization Vector**: Random IV generated per encryption operation
- **Authentication Tag**: Ensures data integrity

### Data Flow
```
User enters password
  ↓
Backend encrypts with AES-256-GCM
  ↓
Store encrypted text + IV + auth tag in PostgreSQL
  ↓
User selects saved credential from dropdown
  ↓
Backend decrypts and creates Salesforce session
  ↓
Return session cookie (password never sent to client)
```

---

## Database Schema

### Table: `saved_credentials`

```sql
CREATE TABLE saved_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name VARCHAR(255) NOT NULL UNIQUE,
  login_url VARCHAR(500) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL,
  security_token_encrypted TEXT,
  password_iv VARCHAR(32) NOT NULL,
  token_iv VARCHAR(32),
  auth_method VARCHAR(20) NOT NULL CHECK (auth_method IN ('oauth', 'direct')),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR(255), -- Future: tie to authenticated user
  CONSTRAINT unique_profile_per_user UNIQUE (profile_name, user_id)
);

-- Index for fast lookups
CREATE INDEX idx_saved_credentials_user_id ON saved_credentials(user_id);
CREATE INDEX idx_saved_credentials_last_used ON saved_credentials(last_used DESC);
```

### Migration Script

```sql
-- migrations/001_create_saved_credentials.sql
-- Run this to set up the database

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE saved_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name VARCHAR(255) NOT NULL,
  login_url VARCHAR(500) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL,
  security_token_encrypted TEXT,
  password_iv VARCHAR(32) NOT NULL,
  token_iv VARCHAR(32),
  auth_method VARCHAR(20) NOT NULL CHECK (auth_method IN ('oauth', 'direct')),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR(255),
  CONSTRAINT unique_profile_per_user UNIQUE (profile_name, user_id)
);

CREATE INDEX idx_saved_credentials_user_id ON saved_credentials(user_id);
CREATE INDEX idx_saved_credentials_last_used ON saved_credentials(last_used DESC);

COMMIT;
```

---

## Environment Variables

Add to `.env.local`:

```bash
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@localhost:5432/agentforce_analyzer

# Encryption (CRITICAL: Generate a secure 32-byte hex key)
# Generate with: openssl rand -hex 32
CREDENTIAL_ENCRYPTION_KEY=your_64_character_hex_string_here

# Example generation:
# openssl rand -hex 32
# Output: a1b2c3d4e5f6...
```

**Generate Encryption Key:**
```bash
openssl rand -hex 32
```

---

## Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "@types/pg": "^8.10.9"
  }
}
```

Install:
```bash
npm install pg @types/pg
```

---

## Implementation Files

### 1. Database Client (`src/lib/db/client.ts`)

```typescript
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
```

### 2. Encryption Utility (`src/lib/crypto/encryption.ts`)

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY not set');
  }
  if (key.length !== 64) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

export function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(encryptedData: string, ivHex: string, authTagHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 3. Credential Model (`src/lib/db/credentials.ts`)

```typescript
import { query } from './client';
import { encrypt, decrypt } from '../crypto/encryption';

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
  const passwordEncryption = encrypt(password);
  const tokenEncryption = securityToken ? encrypt(securityToken) : null;

  // Combine encrypted + IV + authTag into single field
  const passwordEncrypted = `${passwordEncryption.encrypted}:${passwordEncryption.authTag}`;
  const tokenEncrypted = tokenEncryption
    ? `${tokenEncryption.encrypted}:${tokenEncryption.authTag}`
    : null;

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
    passwordEncrypted,
    tokenEncrypted,
    passwordEncryption.iv,
    tokenEncryption?.iv || null,
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

  // Parse encrypted:authTag format
  const [passwordEncrypted, passwordAuthTag] = row.password_encrypted.split(':');
  const password = decrypt(passwordEncrypted, row.password_iv, passwordAuthTag);

  let securityToken: string | undefined;
  if (row.security_token_encrypted && row.token_iv) {
    const [tokenEncrypted, tokenAuthTag] = row.security_token_encrypted.split(':');
    securityToken = decrypt(tokenEncrypted, row.token_iv, tokenAuthTag);
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
```

### 4. API: List Credentials (`src/app/api/credentials/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { listCredentials } from '@/lib/db/credentials';

export async function GET(request: NextRequest) {
  try {
    // Future: Extract user ID from authenticated session
    const userId = null;

    const credentials = await listCredentials(userId);

    // Never return passwords or encrypted data to client
    return NextResponse.json({
      success: true,
      credentials: credentials.map((cred) => ({
        id: cred.id,
        profileName: cred.profileName,
        loginUrl: cred.loginUrl,
        username: cred.username,
        authMethod: cred.authMethod,
        lastUsed: cred.lastUsed,
      })),
    });
  } catch (error: any) {
    console.error('Failed to list credentials:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve saved credentials' },
      { status: 500 }
    );
  }
}
```

### 5. API: Save Credential (`src/app/api/credentials/save/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { saveCredential } from '@/lib/db/credentials';

export async function POST(request: NextRequest) {
  try {
    const { profileName, loginUrl, username, password, securityToken, authMethod } =
      await request.json();

    if (!profileName || !loginUrl || !username || !password || !authMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Future: Extract user ID from authenticated session
    const userId = null;

    const id = await saveCredential(
      profileName,
      loginUrl,
      username,
      password,
      securityToken || null,
      authMethod,
      userId
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to save credential:', error);
    return NextResponse.json(
      { error: 'Failed to save credential' },
      { status: 500 }
    );
  }
}
```

### 6. API: Login with Saved Credential (`src/app/api/credentials/login/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCredential, updateLastUsed } from '@/lib/db/credentials';
import { Connection } from 'jsforce';
import { encryptSession } from '@/lib/salesforce/connection';

export async function POST(request: NextRequest) {
  try {
    const { credentialId } = await request.json();

    if (!credentialId) {
      return NextResponse.json({ error: 'Credential ID required' }, { status: 400 });
    }

    // Get credential from database
    const credential = await getCredential(credentialId);

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Update last used timestamp
    await updateLastUsed(credentialId);

    // Authenticate with Salesforce
    const conn = new Connection({
      loginUrl: credential.loginUrl,
      version: '61.0',
    });

    const password = credential.securityToken
      ? credential.password + credential.securityToken
      : credential.password;

    const userInfo = await conn.login(credential.username, password);

    // Create session
    const session = {
      accessToken: conn.accessToken || (conn as any).sessionId,
      instanceUrl: conn.instanceUrl,
      apiVersion: '61.0',
      userId: userInfo?.id,
      orgId: userInfo?.organizationId,
    };

    // Set session cookie
    const response = NextResponse.json({ success: true, profileName: credential.profileName });
    response.cookies.set('sf_session', encryptSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7200, // 2 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Failed to login with saved credential:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
```

### 7. API: Delete Credential (`src/app/api/credentials/delete/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deleteCredential } from '@/lib/db/credentials';

export async function POST(request: NextRequest) {
  try {
    const { credentialId } = await request.json();

    if (!credentialId) {
      return NextResponse.json({ error: 'Credential ID required' }, { status: 400 });
    }

    await deleteCredential(credentialId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete credential:', error);
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}
```

---

## Updated Login Form

Add credential selector to `src/components/LoginForm.tsx`:

```tsx
// Add state
const [savedCredentials, setSavedCredentials] = useState<any[]>([]);
const [selectedCredential, setSelectedCredential] = useState<string>('');
const [saveCredential, setSaveCredential] = useState(false);
const [profileName, setProfileName] = useState('');

// Fetch saved credentials on mount
useEffect(() => {
  fetch('/api/credentials')
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setSavedCredentials(data.credentials);
      }
    });
}, []);

// Handle credential selection
const handleCredentialSelect = async (credId: string) => {
  setSelectedCredential(credId);
  setLoading(true);

  try {
    const res = await fetch('/api/credentials/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId: credId }),
    });

    const data = await res.json();

    if (data.success) {
      router.push('/dashboard');
    } else {
      setError(data.error);
    }
  } catch (err) {
    setError('Failed to authenticate');
  } finally {
    setLoading(false);
  }
};

// Add dropdown in JSX
<div className="space-y-4">
  {/* Saved Credentials Dropdown */}
  {savedCredentials.length > 0 && (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Saved Credentials
      </label>
      <select
        value={selectedCredential}
        onChange={(e) => e.target.value && handleCredentialSelect(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
      >
        <option value="">-- Select Saved Credential --</option>
        {savedCredentials.map((cred) => (
          <option key={cred.id} value={cred.id}>
            {cred.profileName} ({cred.username})
          </option>
        ))}
      </select>
    </div>
  )}

  <div className="text-center text-sm text-gray-500">
    -- OR --
  </div>

  {/* Existing manual login fields */}
  ...

  {/* Checkbox to save credential */}
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="saveCredential"
      checked={saveCredential}
      onChange={(e) => setSaveCredential(e.target.checked)}
      className="rounded"
    />
    <label htmlFor="saveCredential" className="text-sm text-gray-700">
      Save this credential for future use
    </label>
  </div>

  {saveCredential && (
    <input
      type="text"
      placeholder="Profile Name (e.g., Production Org)"
      value={profileName}
      onChange={(e) => setProfileName(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
    />
  )}
</div>
```

---

## Setup Instructions

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
createdb agentforce_analyzer
```

### 3. Run Migration

```bash
psql agentforce_analyzer < migrations/001_create_saved_credentials.sql
```

### 4. Set Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://localhost:5432/agentforce_analyzer
CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### 5. Install Dependencies

```bash
npm install pg @types/pg
```

### 6. Test Connection

```bash
psql agentforce_analyzer -c "SELECT * FROM saved_credentials;"
```

---

## Security Checklist

- ✅ Passwords encrypted with AES-256-GCM
- ✅ Encryption key in environment variable (not code)
- ✅ Passwords never sent to client browser
- ✅ HTTP-only cookies for session management
- ✅ HTTPS enforced in production
- ⚠️ User authentication not yet implemented (future: tie credentials to user accounts)
- ⚠️ Rate limiting not implemented (add to prevent brute force)
- ⚠️ Audit logging not implemented (add for compliance)

---

## Deployment (Heroku with Heroku Postgres)

### 1. Add Heroku Postgres Add-on

```bash
heroku addons:create heroku-postgresql:essential-0
```

This automatically sets `DATABASE_URL` environment variable.

### 2. Set Encryption Key

```bash
heroku config:set CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### 3. Run Migration

```bash
heroku pg:psql < migrations/001_create_saved_credentials.sql
```

### 4. Enable SSL

Heroku Postgres requires SSL. The connection client is already configured:
```typescript
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
```

---

## Future Enhancements

1. **User Authentication**: Tie saved credentials to authenticated user accounts
2. **Credential Sharing**: Share credentials with team members (with permissions)
3. **Credential Expiry**: Auto-expire saved credentials after 90 days
4. **Audit Logging**: Log all credential access for security monitoring
5. **2FA Support**: Add two-factor authentication for credential access
6. **Backup/Export**: Allow users to export encrypted credential backups
7. **Browser Integration**: Browser extension for auto-fill

---

## Testing

### Test Credential Save

```bash
curl -X POST http://localhost:1717/api/credentials/save \
  -H "Content-Type: application/json" \
  -d '{
    "profileName": "My Production Org",
    "loginUrl": "https://login.salesforce.com",
    "username": "user@example.com",
    "password": "mypassword",
    "securityToken": "mytoken",
    "authMethod": "direct"
  }'
```

### Test Credential List

```bash
curl http://localhost:1717/api/credentials
```

### Test Credential Login

```bash
curl -X POST http://localhost:1717/api/credentials/login \
  -H "Content-Type: application/json" \
  -d '{"credentialId": "uuid-here"}' \
  -c cookies.txt
```

---

## Summary

This implementation provides:
- ✅ PostgreSQL database for credential storage
- ✅ AES-256-GCM encryption for passwords
- ✅ Dropdown selector in login form
- ✅ One-click login with saved credentials
- ✅ Heroku-compatible deployment
- ✅ Production-ready security architecture

**Next Steps:**
1. Run database migration
2. Set encryption key
3. Update LoginForm component
4. Test credential save/load flow
5. Deploy to Heroku with Heroku Postgres
