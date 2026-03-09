import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForSession, encryptSession, getRedirectUri } from '@/lib/salesforce/connection';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    // Get the login URL from the cookie set during authorization
    const loginUrl = request.cookies.get('sf_login_url')?.value || 'https://login.salesforce.com';

    // Get the base URL from the request
    const { protocol, host } = request.nextUrl;
    const baseUrl = `${protocol}//${host}`;
    const redirectUri = getRedirectUri(baseUrl);

    const session = await exchangeCodeForSession(code, loginUrl, redirectUri);

    const response = NextResponse.json({
      success: true,
      orgId: session.orgId,
      instanceUrl: session.instanceUrl,
    });

    response.cookies.set('sf_session', encryptSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7200,
      path: '/',
    });

    // Clean up the login URL cookie
    response.cookies.delete('sf_login_url');

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
