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
    let actualLoginUrl = loginUrl.trim();

    // Remove query parameters (e.g., ?un=username)
    actualLoginUrl = actualLoginUrl.split('?')[0];

    // Remove trailing slashes
    actualLoginUrl = actualLoginUrl.replace(/\/$/, '');

    // If it's a lightning.force.com URL, convert to My Domain login
    if (actualLoginUrl.includes('.lightning.force.com')) {
      // Extract the domain name (storm-f4e8ebcbe3cc7a from https://storm-f4e8ebcbe3cc7a.lightning.force.com)
      const match = actualLoginUrl.match(/https:\/\/([^.]+)\.lightning\.force\.com/);
      if (match) {
        const domain = match[1];
        actualLoginUrl = `https://${domain}.my.salesforce.com`;
        console.log('Converted to My Domain URL:', actualLoginUrl);
      }
    } else if (actualLoginUrl.includes('.my.salesforce.com') ||
               actualLoginUrl.includes('.develop.my.salesforce.com') ||
               actualLoginUrl.includes('.scratch.my.salesforce.com')) {
      // Already a proper login URL
      actualLoginUrl = actualLoginUrl;
    } else if (actualLoginUrl.includes('login.salesforce.com')) {
      // Production
      actualLoginUrl = 'https://login.salesforce.com';
    } else if (actualLoginUrl.includes('test.salesforce.com')) {
      // Sandbox
      actualLoginUrl = 'https://test.salesforce.com';
    } else {
      // If not a standard login URL, try to use it as-is but might need adjustment
      console.warn('URL format not recognized, using as-is:', actualLoginUrl);
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
    console.log('User Info received:', !!userInfo);
    console.log('User ID:', userInfo?.id);
    console.log('Org ID:', userInfo?.organizationId);
    console.log('Connection state - Access Token:', !!conn.accessToken);
    console.log('Connection state - Instance URL:', conn.instanceUrl);

    // Extract session information - jsforce stores it in different places
    // TypeScript doesn't know about sessionId but it might exist at runtime
    const accessToken = conn.accessToken || (conn as any).sessionId;
    const instanceUrl = conn.instanceUrl;
    const userId = userInfo?.id || (userInfo as any)?.userId;
    const orgId = userInfo?.organizationId;

    console.log('Extracted values:');
    console.log('- accessToken:', !!accessToken);
    console.log('- instanceUrl:', instanceUrl);
    console.log('- userId:', userId);
    console.log('- orgId:', orgId);

    // Verify we have the required session information
    const missingFields = [];
    if (!accessToken) {
      console.error('ERROR: No access token or session ID found');
      missingFields.push('access token');
    }

    if (!instanceUrl) {
      console.error('ERROR: No instance URL found');
      missingFields.push('instance URL');
    }

    if (!userId) {
      console.error('ERROR: No user ID found');
      missingFields.push('user ID');
    }

    if (!orgId) {
      console.error('ERROR: No org ID found');
      missingFields.push('organization ID');
    }

    if (missingFields.length > 0) {
      const errorMsg = `Login succeeded but could not extract: ${missingFields.join(', ')}. Please try again or contact support.`;
      console.error('MISSING FIELDS:', missingFields);
      throw new Error(errorMsg);
    }

    // Create session object
    const session = {
      accessToken: accessToken,
      instanceUrl: instanceUrl,
      apiVersion: '61.0',
      userId: userId,
      orgId: orgId,
    };

    console.log('Session created successfully:', {
      hasToken: !!session.accessToken,
      hasUrl: !!session.instanceUrl,
      hasUserId: !!session.userId,
      hasOrgId: !!session.orgId
    });

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
    } else if (error.errorCode === 'INVALID_OPERATION' || error.message?.includes('SOAP API login')) {
      errorMessage = 'SOAP API is disabled in this org. Please use OAuth Login (switch to OAuth tab) or contact your admin to enable SOAP API in Setup → Security → Session Settings.';
    } else if (error.message?.includes('security token')) {
      errorMessage = 'Security token required. Enter your security token in the "Security Token" field below the password field. To get your token: Setup → Personal Settings → My Personal Information → Reset My Security Token (will be emailed to you).';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
