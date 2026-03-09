import { NextRequest, NextResponse } from 'next/server';

// Username/password authentication is not implemented
// The application uses OAuth 2.0 via /api/auth/authorize and /api/auth/callback
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Username/password authentication is not implemented. Please use OAuth 2.0 login.',
    },
    { status: 501 }
  );
}
