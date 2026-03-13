import { NextRequest } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { getAuthenticatedConnection, jsonError, jsonSuccess } from '@/lib/api';

export async function GET(request: NextRequest) {
  const auth = getAuthenticatedConnection(request);
  if (!auth.ok) return auth.response;
  const { conn, session } = auth;

  try {
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

    try {
      writeFileSync(join(process.cwd(), 'debug-output.json'), JSON.stringify(output, null, 2));
    } catch {
      // ignore write errors
    }

    return jsonSuccess(output);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Debug failed', 500);
  }
}
