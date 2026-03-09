import { NextRequest, NextResponse } from 'next/server';
import { decryptSession, getConnection } from '@/lib/salesforce/connection';
import { writeFileSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sf_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = decryptSession(sessionCookie);
    const conn = getConnection(session);
    const results: Record<string, unknown> = {};

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
        const result = await conn.tooling.query(`SELECT Id, DeveloperName, MasterLabel FROM ${obj} LIMIT 10`);
        results[obj] = { count: result.totalSize, records: result.records };
      } catch (e) {
        results[obj] = { error: e instanceof Error ? e.message : 'Query failed' };
      }
    }

    // Also try standard SOQL
    try {
      const result = await conn.query("SELECT Id, DeveloperName, MasterLabel FROM BotDefinition LIMIT 10");
      results['BotDefinition_SOQL'] = { count: result.totalSize, records: result.records };
    } catch (e) {
      results['BotDefinition_SOQL'] = { error: e instanceof Error ? e.message : 'Query failed' };
    }

    const output = { session: { instanceUrl: session.instanceUrl, apiVersion: session.apiVersion }, results };

    // Save to disk so we can read it
    try {
      writeFileSync('/Users/ajaykumar/AgentAnalysis/agentforce-analyzer/debug-output.json', JSON.stringify(output, null, 2));
    } catch {
      // ignore write errors
    }

    return NextResponse.json(output);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Debug failed' }, { status: 500 });
  }
}
