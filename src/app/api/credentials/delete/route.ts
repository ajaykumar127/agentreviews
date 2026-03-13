import { NextRequest, NextResponse } from 'next/server';
import { deleteCredential } from '@/lib/db/credentials';

/**
 * POST /api/credentials/delete
 * Delete a saved credential
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

    await deleteCredential(credentialId);

    return NextResponse.json({
      success: true,
      message: 'Credential deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete credential:', error);
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}
