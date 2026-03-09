import { NextRequest, NextResponse } from 'next/server';
import { Connection } from 'jsforce';

export async function POST(request: NextRequest) {
  try {
    const { loginUrl, username, password } = await request.json();

    console.log('=== Test Login Attempt ===');
    console.log('Login URL:', loginUrl);
    console.log('Username:', username);

    // Create a simple connection
    const conn = new Connection({
      loginUrl: loginUrl || 'https://login.salesforce.com',
      version: '61.0'
    });

    // Attempt login
    const userInfo = await conn.login(username, password);

    console.log('=== Login Response ===');
    console.log('Success:', !!userInfo);
    console.log('User ID:', userInfo?.id);
    console.log('Org ID:', userInfo?.organizationId);
    console.log('Access Token exists:', !!conn.accessToken);
    console.log('Instance URL:', conn.instanceUrl);

    return NextResponse.json({
      success: true,
      debug: {
        hasUserInfo: !!userInfo,
        userId: userInfo?.id,
        orgId: userInfo?.organizationId,
        hasAccessToken: !!conn.accessToken,
        instanceUrl: conn.instanceUrl,
      }
    });
  } catch (error: any) {
    console.error('=== Login Failed ===');
    console.error('Error code:', error.errorCode);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));

    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.errorCode,
      debug: error
    }, { status: 401 });
  }
}
