import { NextResponse } from 'next/server';

/**
 * Standard JSON error response for API routes.
 * Use for 4xx/5xx to keep error shape consistent across the app.
 */
export function jsonError(
  message: string,
  status: number = 500,
  extra?: Record<string, unknown>
): NextResponse {
  const body = { error: message, ...extra };
  return NextResponse.json(body, { status });
}

/**
 * Standard JSON success response. Optional helper for consistency.
 */
export function jsonSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
