import { NextRequest, NextResponse } from 'next/server';
import { decryptSession, getConnection } from '@/lib/salesforce/connection';
import { analyzeOrg } from '@/lib/analysis/engine';
import { Connection } from 'jsforce';

async function debugOrgMetadata(conn: Connection) {
  const debug: Record<string, unknown> = {};
  const objectsToTry = [
    'BotDefinition',
    'Bot',
    'BotVersion',
    'GenAiPlanner',
    'GenAiPlannerBundle',
    'GenAiPlugin',
    'GenAiFunction',
    'GenAiPlannerFunctionDef',
    'GenAiPromptTemplate',
  ];

  for (const obj of objectsToTry) {
    try {
      const result = await conn.tooling.query(
        `SELECT Id, DeveloperName, MasterLabel FROM ${obj} LIMIT 10`
      );
      debug[obj] = { count: result.totalSize, records: result.records };
    } catch (e) {
      debug[obj] = { error: e instanceof Error ? e.message : 'Query failed' };
    }
  }
  return debug;
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sf_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = decryptSession(sessionCookie);
    const conn = getConnection(session);
    const report = await analyzeOrg(conn);

    // If no agents found, include debug info to help diagnose
    if (report.agents.length === 0) {
      const debug = await debugOrgMetadata(conn);
      return NextResponse.json({ ...report, debug });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', stack);

    if (message.includes('INVALID_SESSION') || message.includes('Session expired')) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
