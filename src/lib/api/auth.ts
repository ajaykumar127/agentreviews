import { NextRequest, NextResponse } from 'next/server';
import { Connection } from 'jsforce';
import { decryptSession, getConnection } from '@/lib/salesforce/connection';
import type { SalesforceSession } from '@/lib/salesforce/types';

export type AuthResult =
  | { ok: true; conn: Connection; session: SalesforceSession }
  | { ok: false; response: NextResponse };

/**
 * Reads the Salesforce session from the request cookie, decrypts it,
 * and returns a jsforce Connection. Use in API routes that require auth.
 * Returns a 401 NextResponse if the session is missing or invalid.
 */
export function getAuthenticatedConnection(request: NextRequest): AuthResult {
  const sessionCookie = request.cookies.get('sf_session')?.value;
  if (!sessionCookie) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  try {
    const session = decryptSession(sessionCookie);
    const conn = getConnection(session);
    return { ok: true, conn, session };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Session expired or invalid. Please log in again.' },
        { status: 401 }
      ),
    };
  }
}
