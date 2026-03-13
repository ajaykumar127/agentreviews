import { NextRequest } from 'next/server';
import { getAuthenticatedConnection, jsonError, jsonSuccess } from '@/lib/api';
import { listAgents } from '@/lib/salesforce/queries';

export async function GET(request: NextRequest) {
  const auth = getAuthenticatedConnection(request);
  if (!auth.ok) return auth.response;

  try {
    const agents = await listAgents(auth.conn);
    return jsonSuccess({
      agents: agents.map((a) => ({
        id: a.Id,
        name: a.MasterLabel,
        developerName: a.DeveloperName,
        description: a.Description,
        type: a.Type,
      })),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to fetch agents', 500);
  }
}
