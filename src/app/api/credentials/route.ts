import { NextRequest, NextResponse } from 'next/server';
import { listCredentials } from '@/lib/db/credentials';

/**
 * GET /api/credentials
 * List all saved credentials (without passwords)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        credentials: [],
        message: 'Credential store not configured',
      });
    }

    // Future: Extract user ID from authenticated session
    const userId: string | undefined = undefined;

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
    // Gracefully degrade - return empty list instead of error
    return NextResponse.json({
      success: true,
      credentials: [],
      message: 'Credential store unavailable',
    });
  }
}
