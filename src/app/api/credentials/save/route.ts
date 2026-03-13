import { NextRequest, NextResponse } from 'next/server';
import { saveCredential } from '@/lib/db/credentials';

/**
 * POST /api/credentials/save
 * Save a new credential or update existing one
 */
export async function POST(request: NextRequest) {
  try {
    const { profileName, loginUrl, username, password, securityToken, authMethod } =
      await request.json();

    // Validation
    if (!profileName || !loginUrl || !username || !password || !authMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: profileName, loginUrl, username, password, authMethod' },
        { status: 400 }
      );
    }

    if (authMethod !== 'oauth' && authMethod !== 'direct') {
      return NextResponse.json(
        { error: 'authMethod must be either "oauth" or "direct"' },
        { status: 400 }
      );
    }

    // Future: Extract user ID from authenticated session
    const userId: string | undefined = undefined;

    const id = await saveCredential(
      profileName,
      loginUrl,
      username,
      password,
      securityToken || null,
      authMethod,
      userId
    );

    return NextResponse.json({
      success: true,
      id,
      message: 'Credential saved successfully',
    });
  } catch (error: any) {
    console.error('Failed to save credential:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A credential with this profile name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save credential' },
      { status: 500 }
    );
  }
}
