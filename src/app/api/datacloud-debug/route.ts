import { NextRequest } from 'next/server';
import { getAuthenticatedConnection, jsonError, jsonSuccess } from '@/lib/api';
import { getDataCloudInfo, checkAgentforcePermissions } from '@/lib/salesforce/queries';

export async function POST(request: NextRequest) {
  const auth = getAuthenticatedConnection(request);
  if (!auth.ok) return auth.response;
  const conn = auth.conn;

  try {

    console.log('=== Data Cloud Debug Scan Starting ===');

    // Get Data Cloud info with full debug
    const dataCloudInfo = await getDataCloudInfo(conn);

    // Get current user ID
    const userInfo = await conn.identity();
    const userId = userInfo.user_id;

    // Check Agentforce permissions
    const permissionsInfo = await checkAgentforcePermissions(conn, userId);

    // Additional queries for debugging
    const debugResults: any = {
      dataCloud: dataCloudInfo,
      permissions: permissionsInfo,
      additionalInfo: {},
    };

    // Try to query some specific Data Cloud objects directly
    const testQueries = [
      { name: 'GenAiRetriever', query: 'SELECT COUNT() FROM GenAiRetriever' },
      { name: 'DataCloudAddress', query: 'SELECT COUNT() FROM DataCloudAddress' },
      { name: 'DataSourceObject', query: 'SELECT COUNT() FROM DataSourceObject' },
      { name: 'CdpQuery', query: 'SELECT COUNT() FROM CdpQuery' },
      { name: 'ExternalDataSource', query: 'SELECT COUNT() FROM ExternalDataSource' },
    ];

    for (const test of testQueries) {
      try {
        const result = await conn.query(test.query);
        debugResults.additionalInfo[test.name] = {
          success: true,
          count: result.totalSize,
        };
      } catch (error: any) {
        debugResults.additionalInfo[test.name] = {
          success: false,
          error: error.errorCode || error.message || 'Unknown error',
        };
      }
    }

    console.log('=== Data Cloud Debug Scan Complete ===');

    return jsonSuccess({
      success: true,
      data: debugResults,
      summary: {
        dataCloudEnabled: dataCloudInfo.isEnabled,
        dataSourcesFound: dataCloudInfo.dataSources.length,
        retrieversFound: dataCloudInfo.retrievers.length,
        searchIndexesFound: dataCloudInfo.searchIndexes.length,
        hasAgentforceAccess: permissionsInfo.hasAgentforceAccess,
        availableObjectsScanned: dataCloudInfo.debugInfo?.availableObjects.length || 0,
        dataCloudObjectsFound: dataCloudInfo.debugInfo?.dataCloudObjects.length || 0,
        queriesAttempted: dataCloudInfo.debugInfo?.queriesAttempted.length || 0,
        errorsEncountered: dataCloudInfo.debugInfo?.errors.length || 0,
      },
    });
  } catch (error: unknown) {
    console.error('Data Cloud debug scan failed:', error);
    const message = error instanceof Error ? error.message : 'Debug scan failed';
    return jsonError(message, 500, {
      details: error instanceof Error ? error.toString() : String(error),
    });
  }
}
