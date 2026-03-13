import { NextRequest, NextResponse } from 'next/server';
import { getCredential, updateLastUsed } from '@/lib/db/credentials';
import { Connection } from 'jsforce';
import { encryptSession } from '@/lib/salesforce/connection';

/**
 * POST /api/credentials/login
 * Login using a saved credential
 */
export async function POST(request: NextRequest) {
  try {
    const { credentialId } = await request.json();

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credentialId is required' },
        { status: 400 }
      );
    }

    // Get credential from database
    const credential = await getCredential(credentialId);

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Update last used timestamp
    await updateLastUsed(credentialId);

    // Normalize login URL (convert Lightning URLs to My Domain)
    let actualLoginUrl = credential.loginUrl.trim().split('?')[0].replace(/\/$/, '');

    if (actualLoginUrl.includes('.lightning.force.com')) {
      const match = actualLoginUrl.match(/https:\/\/([^.]+)\.lightning\.force\.com/);
      if (match) {
        const domain = match[1];
        actualLoginUrl = `https://${domain}.my.salesforce.com`;
      }
    }

    // Authenticate with Salesforce
    const conn = new Connection({
      loginUrl: actualLoginUrl,
      version: '61.0',
    });

    // Combine password and security token
    const password = credential.securityToken
      ? credential.password + credential.securityToken
      : credential.password;

    const userInfo = await conn.login(credential.username, password);

    // Extract session information
    const accessToken = conn.accessToken || (conn as any).sessionId;
    const instanceUrl = conn.instanceUrl;
    const userId = userInfo?.id;
    const orgId = userInfo?.organizationId;

    if (!accessToken || !instanceUrl || !userId || !orgId) {
      throw new Error('Login succeeded but could not extract session information');
    }

    // Create session
    const session = {
      accessToken,
      instanceUrl,
      apiVersion: '61.0',
      userId,
      orgId,
    };

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      profileName: credential.profileName,
      orgId,
      instanceUrl,
    });

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

    let errorMessage = 'Authentication failed';

    if (error.errorCode === 'INVALID_LOGIN') {
      errorMessage = 'Invalid username or password';
    } else if (error.message?.includes('security token')) {
      errorMessage = 'Security token required or invalid';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
