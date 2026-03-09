import { NextRequest, NextResponse } from 'next/server';
import { getOAuthAuthorizeUrl } from '@/lib/salesforce/connection';

export async function GET(request: NextRequest) {
  const loginUrl = request.nextUrl.searchParams.get('loginUrl') || 'https://login.salesforce.com';

  // Store loginUrl in a cookie so the callback knows which token endpoint to use
  const authorizeUrl = getOAuthAuthorizeUrl(loginUrl);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set('sf_login_url', loginUrl, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
