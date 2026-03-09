import { NextRequest, NextResponse } from 'next/server';
import { Connection } from 'jsforce';
import { encryptSession } from '@/lib/salesforce/connection';

export async function POST(request: NextRequest) {
  try {
    const { loginUrl, username, password } = await request.json();

    if (!loginUrl || !username || !password) {
      return NextResponse.json(
        { error: 'Login URL, username, and password are required' },
        { status: 400 }
      );
    }

    console.log('=== Direct Login Attempt ===');
    console.log('Original URL:', loginUrl);
    console.log('Username:', username);

    // Convert Lightning URL to proper login URL
    let actualLoginUrl = loginUrl;

    // If it's a lightning.force.com URL, convert to My Domain login
    if (loginUrl.includes('.lightning.force.com')) {
      // Extract the domain name (storm-f4e8ebcbe3cc7a from https://storm-f4e8ebcbe3cc7a.lightning.force.com)
      const match = loginUrl.match(/https:\/\/([^.]+)\.lightning\.force\.com/);
      if (match) {
        const domain = match[1];
        actualLoginUrl = `https://${domain}.my.salesforce.com`;
        console.log('Converted to My Domain URL:', actualLoginUrl);
      }
    } else if (loginUrl.includes('.my.salesforce.com') ||
               loginUrl.includes('.develop.my.salesforce.com') ||
               loginUrl.includes('.scratch.my.salesforce.com')) {
      // Already a proper login URL
      actualLoginUrl = loginUrl;
    } else if (!loginUrl.includes('login.salesforce.com') && !loginUrl.includes('test.salesforce.com')) {
      // If not a standard login URL, try to use it as-is but might need adjustment
      console.warn('URL format not recognized, using as-is:', loginUrl);
    }

    // Create connection with proper API version
    const conn = new Connection({
      loginUrl: actualLoginUrl,
      version: '61.0'
    });

    console.log('Attempting login to:', actualLoginUrl);

    // Login with username/password
    const userInfo = await conn.login(username, password);

    console.log('✓ Login successful');
    console.log('User ID:', userInfo.id);
    console.log('Org ID:', userInfo.organizationId);
    console.log('Instance URL:', conn.instanceUrl);

    // Create session object
    const session = {
      accessToken: conn.accessToken!,
      instanceUrl: conn.instanceUrl!,
      apiVersion: '61.0',
      userId: userInfo.id,
      orgId: userInfo.organizationId,
    };

    // Encrypt and set cookie
    const encryptedSession = encryptSession(session);
    const response = NextResponse.json({ success: true });
    response.cookies.set('sf_session', encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('=== Direct Login Error ===');
    console.error(error);

    let errorMessage = 'Login failed';

    if (error.errorCode === 'INVALID_LOGIN') {
      errorMessage = 'Invalid username or password';
    } else if (error.message?.includes('security token')) {
      errorMessage = 'Security token required. Please add your security token to the password or whitelist your IP.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
