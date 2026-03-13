import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedConnection } from '@/lib/api';
import { jsonError } from '@/lib/api/responses';
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
  const start = Date.now();
  const auth = getAuthenticatedConnection(request);
  if (!auth.ok) return auth.response;

  const conn = auth.conn;
  try {
    console.log('[Scan] Request received');
    console.log('[Scan] Session OK, starting org analysis...');
    const report = await analyzeOrg(conn);
    console.log(`[Scan] Done in ${((Date.now() - start) / 1000).toFixed(1)}s – ${report.agents.length} agent(s), ${report.summary.criticalCount} critical, ${report.summary.warningCount} warnings`);

    // If no agents found, include debug info to help diagnose
    if (report.agents.length === 0) {
      console.log('[Scan] No agents found – fetching debug metadata...');
      const debug = await debugOrgMetadata(conn);
      return NextResponse.json({ ...report, debug });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('[Scan] Error after', ((Date.now() - start) / 1000).toFixed(1), 's:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', stack);

    if (message.includes('INVALID_SESSION') || message.includes('Session expired')) {
      return jsonError('Session expired. Please log in again.', 401);
    }
    return jsonError(message, 500, { stack });
  }
}
