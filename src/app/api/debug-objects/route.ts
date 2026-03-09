import { NextRequest, NextResponse } from 'next/server';
import { decryptSession, getConnection } from '@/lib/salesforce/connection';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sf_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = decryptSession(sessionCookie);
    const conn = getConnection(session);

    // Test different object names for Agentforce agents
    const objectsToTest = [
      // Tooling API objects
      { api: 'tooling', name: 'BotDefinition', query: 'SELECT Id, DeveloperName, MasterLabel FROM BotDefinition LIMIT 5' },
      { api: 'tooling', name: 'Bot', query: 'SELECT Id, DeveloperName, MasterLabel FROM Bot LIMIT 5' },
      { api: 'tooling', name: 'GenAiPlanner', query: 'SELECT Id, DeveloperName, MasterLabel FROM GenAiPlanner LIMIT 5' },
      { api: 'tooling', name: 'GenAiPlannerBundle', query: 'SELECT Id, DeveloperName, MasterLabel FROM GenAiPlannerBundle LIMIT 5' },
      { api: 'tooling', name: 'MLModel', query: 'SELECT Id, DeveloperName, MasterLabel FROM MLModel LIMIT 5' },

      // Standard API objects
      { api: 'standard', name: 'AgentWork', query: 'SELECT Id, Name FROM AgentWork LIMIT 5' },
      { api: 'standard', name: 'Agent', query: 'SELECT Id, Name FROM Agent LIMIT 5' },
      { api: 'standard', name: 'AIApplication', query: 'SELECT Id, Name, DeveloperName FROM AIApplication LIMIT 5' },
      { api: 'standard', name: 'AIApplicationConfig', query: 'SELECT Id, Name FROM AIApplicationConfig LIMIT 5' },
      { api: 'standard', name: 'ConversationalIntelligence', query: 'SELECT Id, Name FROM ConversationalIntelligence LIMIT 5' },
    ];

    const results: any[] = [];

    for (const test of objectsToTest) {
      try {
        let result;
        if (test.api === 'tooling') {
          result = await conn.tooling.query(test.query);
        } else {
          result = await conn.query(test.query);
        }

        results.push({
          object: test.name,
          api: test.api,
          status: 'SUCCESS',
          count: result.totalSize || result.records.length,
          records: result.records.slice(0, 3).map((r: any) => ({
            Id: r.Id,
            Name: r.Name || r.MasterLabel || 'N/A',
            DeveloperName: r.DeveloperName || 'N/A'
          }))
        });
      } catch (error: any) {
        results.push({
          object: test.name,
          api: test.api,
          status: 'FAILED',
          error: error.message || 'Unknown error'
        });
      }
    }

    // Also try to describe objects
    const describeResults: any[] = [];
    try {
      const globalDescribe = await conn.describeGlobal();
      const agentRelatedObjects = globalDescribe.sobjects
        .filter((obj: any) =>
          obj.name.toLowerCase().includes('agent') ||
          obj.name.toLowerCase().includes('bot') ||
          obj.name.toLowerCase().includes('genai') ||
          obj.name.toLowerCase().includes('copilot') ||
          obj.name.toLowerCase().includes('ai')
        )
        .map((obj: any) => ({
          name: obj.name,
          label: obj.label,
          queryable: obj.queryable,
          custom: obj.custom
        }));

      describeResults.push(...agentRelatedObjects);
    } catch (error) {
      console.error('Failed to describe global:', error);
    }

    return NextResponse.json({
      queryResults: results,
      availableObjects: describeResults,
      successfulObjects: results.filter(r => r.status === 'SUCCESS')
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Debug failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
