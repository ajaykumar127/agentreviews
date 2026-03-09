import { NextRequest, NextResponse } from 'next/server';
import { decryptSession, getConnection } from '@/lib/salesforce/connection';
import { listAgents } from '@/lib/salesforce/queries';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sf_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = decryptSession(sessionCookie);
    const conn = getConnection(session);
    const agents = await listAgents(conn);

    return NextResponse.json({
      agents: agents.map((a) => ({
        id: a.Id,
        name: a.MasterLabel,
        developerName: a.DeveloperName,
        description: a.Description,
        type: a.Type,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
