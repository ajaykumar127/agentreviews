import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedConnection, jsonError, jsonSuccess } from '@/lib/api';

export async function POST(request: NextRequest) {
  const auth = getAuthenticatedConnection(request);
  if (!auth.ok) return auth.response;
  const conn = auth.conn;

  try {

    // Comprehensive list of possible Data Cloud and Einstein objects
    const objectsToTry = [
      // Data Cloud Core
      'DataCloudTenant',
      'DataCloudDataSource',
      'DataSourceObject',
      'DataSourceTenant',
      'DataSource',
      'ExternalDataSource',
      'DataSourceBundleDefinition',

      // Einstein/AI Retrievers
      'GenAiRetriever',
      'AIRetriever',
      'EinsteinRetriever',
      'GenAiRetrieverConfig',
      'PromptRetriever',

      // Search Indexes
      'SearchIndex',
      'DataCloudSearchIndex',
      'AISearchIndex',
      'EinsteinSearchIndex',
      'VectorIndex',

      // Data Spaces / Data Model
      'DataSpace',
      'DataModel',
      'DataModelObject',
      'CalculatedInsight',

      // Data Cloud Connectors
      'DataConnector',
      'DataConnection',
      'DataStream',
      'DataStreamDefinition',
    ];

    const results = {
      successfulQueries: [] as any[],
      failedQueries: [] as any[],
    };

    console.log('=== Starting comprehensive Data Cloud scan ===');

    for (const objName of objectsToTry) {
      // Try standard API
      try {
        const result = await conn.query(`SELECT Id, Name FROM ${objName} LIMIT 5`);
        if (result.totalSize >= 0) {
          const data = {
            object: objName,
            api: 'Standard API',
            count: result.totalSize,
            records: result.records.map((r: any) => ({
              Id: r.Id,
              Name: r.Name || r.DeveloperName || r.MasterLabel || 'N/A',
            })),
          };
          console.log(`✓ ${objName}: ${result.totalSize} records`);
          results.successfulQueries.push(data);
          continue;
        }
      } catch (error: any) {
        // Standard API failed, try tooling API
      }

      // Try Tooling API
      try {
        const result = await conn.tooling.query(`SELECT Id, DeveloperName, MasterLabel FROM ${objName} LIMIT 5`);
        if (result.totalSize >= 0) {
          const data = {
            object: objName,
            api: 'Tooling API',
            count: result.totalSize,
            records: result.records.map((r: any) => ({
              Id: r.Id,
              Name: r.DeveloperName || r.MasterLabel || 'N/A',
            })),
          };
          console.log(`✓ ${objName} (tooling): ${result.totalSize} records`);
          results.successfulQueries.push(data);
          continue;
        }
      } catch (error: any) {
        results.failedQueries.push({
          object: objName,
          error: error.message || 'Unknown error',
        });
      }
    }

    console.log('=== Data Cloud scan complete ===');
    console.log(`Successful: ${results.successfulQueries.length}`);
    console.log(`Failed: ${results.failedQueries.length}`);

    return jsonSuccess(results);
  } catch (error) {
    console.error('Scan error:', error);
    return jsonError(error instanceof Error ? error.message : 'Scan failed', 500);
  }
}
