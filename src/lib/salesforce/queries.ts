import { Connection } from 'jsforce';
import type { MetadataType } from 'jsforce/lib/api/metadata';
import type {
  BotRecord,
  BotVersionRecord,
  GenAiPluginRecord,
  GenAiFunctionRecord,
  GenAiPluginMetadata,
  GenAiFunctionMetadata,
  BotMetadata,
  BotVersionMetadata,
  AiEvaluationDefinitionRecord,
  ChannelDeploymentRecord,
  DataCloudRecord,
  DataSourceRecord,
  RetrieverRecord,
  SearchIndexRecord,
} from './types';

export async function listAgents(conn: Connection): Promise<BotRecord[]> {
  console.log('=== Starting agent discovery ===');
  console.log('Org ID:', conn.instanceUrl);

  // Query GenAiPlannerBundle - this is where Agentforce agents are stored
  try {
    console.log('Querying GenAiPlannerBundle...');
    const result = await conn.tooling.query<BotRecord>(
      "SELECT Id, DeveloperName, MasterLabel, Description FROM GenAiPlannerBundle"
    );
    console.log(`✓ Found ${result.records.length} Agentforce agents`);

    if (result.records.length > 0) {
      const agents = result.records.map((r) => ({
        ...r,
        Description: r.Description ?? null,
        Type: r.Type ?? 'AgentforcePlanner',
      }));
      console.log('Agents found:');
      agents.forEach(a => {
        console.log(`  - ${a.MasterLabel} (${a.DeveloperName})`);
      });
      console.log('=== Agent discovery complete ===');
      return agents;
    }
  } catch (err: any) {
    console.log(`✗ GenAiPlannerBundle query failed: ${err?.message || err}`);
  }

  // Fallback: Try standard SOQL API for BotDefinition
  console.log('Trying BotDefinition via standard API...');
  try {
    const result = await conn.query<BotRecord>(
      "SELECT Id, DeveloperName, MasterLabel, Description FROM BotDefinition"
    );
    console.log(`✓ Found ${result.records.length} bots via BotDefinition`);

    if (result.records.length > 0) {
      const agents = result.records.map((r) => ({
        ...r,
        Description: r.Description ?? null,
        Type: r.Type ?? 'Bot',
      }));
      console.log('Agents found:');
      agents.forEach(a => {
        console.log(`  - ${a.MasterLabel} (${a.DeveloperName})`);
      });
      console.log('=== Agent discovery complete ===');
      return agents;
    }
  } catch (err: any) {
    console.log(`✗ BotDefinition query failed: ${err?.message || err}`);
  }

  console.log('=== No agents found in org ===');
  return [];
}

export async function listGenAiPlanners(conn: Connection): Promise<{ Id: string; DeveloperName: string; MasterLabel: string }[]> {
  try {
    const result = await conn.tooling.query<{ Id: string; DeveloperName: string; MasterLabel: string }>(
      "SELECT Id, DeveloperName, MasterLabel FROM GenAiPlannerBundle"
    );
    return result.records;
  } catch {
    return [];
  }
}

export async function getActiveBotVersion(
  conn: Connection,
  botId: string
): Promise<BotVersionRecord | null> {
  // For GenAiPlannerBundle, there's no separate version object - return a synthetic version
  try {
    const result = await conn.tooling.query<BotVersionRecord>(
      `SELECT Id, DeveloperName FROM GenAiPlannerBundle WHERE Id = '${botId}' LIMIT 1`
    );
    if (result.records.length > 0) {
      return {
        Id: result.records[0].Id,
        DeveloperName: result.records[0].DeveloperName,
        Number: 1,
        Status: 'Active',
        BotId: botId,
      } as BotVersionRecord;
    }
  } catch (err) {
    console.log('GenAiPlannerBundle version query failed, trying BotVersion...');
  }

  // Fallback to BotVersion for legacy bots
  try {
    const result = await conn.tooling.query<BotVersionRecord>(
      `SELECT Id, DeveloperName, Number, Status, BotId FROM BotVersion WHERE BotId = '${botId}' AND Status = 'Active' LIMIT 1`
    );
    return result.records[0] ?? null;
  } catch {
    return null;
  }
}

export async function getTopics(conn: Connection): Promise<GenAiPluginRecord[]> {
  // Try standard API first (GenAiPluginDefinition)
  try {
    const result = await conn.query<GenAiPluginRecord>(
      "SELECT Id, DeveloperName, MasterLabel, Description FROM GenAiPluginDefinition"
    );
    return result.records.map((r) => ({
      ...r,
      Description: r.Description ?? null,
      Language: r.Language ?? null,
    }));
  } catch (err) {
    console.log('GenAiPluginDefinition query failed, trying tooling API...');
  }

  // Fallback to Tooling API
  const queries = [
    "SELECT Id, DeveloperName, MasterLabel, Description, Language FROM GenAiPlugin",
    "SELECT Id, DeveloperName, MasterLabel FROM GenAiPlugin",
  ];
  for (const soql of queries) {
    try {
      const result = await conn.tooling.query<GenAiPluginRecord>(soql);
      return result.records.map((r) => ({
        ...r,
        Description: r.Description ?? null,
        Language: r.Language ?? null,
      }));
    } catch {
      // Try next
    }
  }
  return [];
}

export async function getActions(conn: Connection): Promise<GenAiFunctionRecord[]> {
  // Try standard API first (GenAiFunctionDefinition)
  try {
    const result = await conn.query<GenAiFunctionRecord>(
      "SELECT Id, DeveloperName, MasterLabel, Description FROM GenAiFunctionDefinition"
    );
    return result.records.map((r) => ({
      ...r,
      Description: r.Description ?? null,
    }));
  } catch (err) {
    console.log('GenAiFunctionDefinition query failed, trying tooling API...');
  }

  // Fallback to Tooling API
  const queries = [
    "SELECT Id, DeveloperName, MasterLabel, Description FROM GenAiFunction",
    "SELECT Id, DeveloperName, MasterLabel FROM GenAiFunction",
  ];
  for (const soql of queries) {
    try {
      const result = await conn.tooling.query<GenAiFunctionRecord>(soql);
      return result.records.map((r) => ({
        ...r,
        Description: r.Description ?? null,
      }));
    } catch {
      // Try next
    }
  }
  return [];
}

// Metadata API reads - batch in groups of 10 (SF limit)
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function getTopicMetadata(
  conn: Connection,
  developerNames: string[]
): Promise<GenAiPluginMetadata[]> {
  if (developerNames.length === 0) return [];
  const results: GenAiPluginMetadata[] = [];
  const chunks = chunkArray(developerNames, 10);
  for (const chunk of chunks) {
    try {
      const metadata = await conn.metadata.read('GenAiPlugin' as MetadataType, chunk);
      const items = Array.isArray(metadata) ? metadata : [metadata];
      results.push(...(items as unknown as GenAiPluginMetadata[]));
    } catch {
      // Skip failed chunks
    }
  }
  return results;
}

export async function getActionMetadata(
  conn: Connection,
  developerNames: string[]
): Promise<GenAiFunctionMetadata[]> {
  if (developerNames.length === 0) return [];
  const results: GenAiFunctionMetadata[] = [];
  const chunks = chunkArray(developerNames, 10);
  for (const chunk of chunks) {
    try {
      const metadata = await conn.metadata.read('GenAiFunction' as MetadataType, chunk);
      const items = Array.isArray(metadata) ? metadata : [metadata];
      results.push(...(items as unknown as GenAiFunctionMetadata[]));
    } catch {
      // Skip failed chunks
    }
  }
  return results;
}

export async function getBotMetadata(
  conn: Connection,
  developerNames: string[]
): Promise<BotMetadata[]> {
  if (developerNames.length === 0) return [];

  // Try GenAiPlanner metadata type for Agentforce agents
  try {
    const metadata = await conn.metadata.read('GenAiPlanner' as MetadataType, developerNames);
    const items = Array.isArray(metadata) ? metadata : [metadata];
    return items as unknown as BotMetadata[];
  } catch (err) {
    console.log('GenAiPlanner metadata read failed, trying Bot...');
  }

  // Fallback to Bot metadata type for legacy bots
  try {
    const metadata = await conn.metadata.read('Bot', developerNames);
    const items = Array.isArray(metadata) ? metadata : [metadata];
    return items as unknown as BotMetadata[];
  } catch {
    return [];
  }
}

export async function getBotVersionMetadata(
  conn: Connection,
  developerNames: string[]
): Promise<BotVersionMetadata[]> {
  if (developerNames.length === 0) return [];
  try {
    const metadata = await conn.metadata.read('BotVersion' as MetadataType, developerNames);
    const items = Array.isArray(metadata) ? metadata : [metadata];
    return items as unknown as BotVersionMetadata[];
  } catch {
    return [];
  }
}

// Test Stage Query - Try multiple object names
export async function getTestDefinitions(
  conn: Connection,
  botDeveloperName: string
): Promise<AiEvaluationDefinitionRecord[]> {
  // AiEvaluationDefinition might not be available in all orgs
  // Return empty array to skip test checks gracefully
  try {
    const query = `
      SELECT Id, DeveloperName, MasterLabel, SubjectName, SubjectVersion, IsActive
      FROM AiEvaluationDefinition
      WHERE SubjectName = '${botDeveloperName}'
    `;
    const result = await conn.tooling.query<AiEvaluationDefinitionRecord>(query);
    return result.records || [];
  } catch (error) {
    // Object not available - skip test checks
    return [];
  }
}

// Channel Deployment Query - Try multiple approaches
export async function getChannelDeployments(
  conn: Connection,
  botId: string
): Promise<ChannelDeploymentRecord[]> {
  // BotChannelDefinition might not be available for GenAiPlannerBundle agents
  // Return empty array to skip channel checks gracefully
  try {
    const query = `
      SELECT Id, BotId, ChannelType, IsActive
      FROM BotChannelDefinition
      WHERE BotId = '${botId}'
    `;
    const result = await conn.tooling.query<ChannelDeploymentRecord>(query);
    return result.records || [];
  } catch (error) {
    // Object not available - skip channel deployment checks
    return [];
  }
}

// Helper function to safely query an object
async function safeQuery(
  conn: Connection,
  soql: string,
  useTooling = false
): Promise<{ success: boolean; records: any[] }> {
  try {
    const api = useTooling ? conn.tooling : conn;
    const result = await api.query(soql);
    return { success: true, records: result.records || [] };
  } catch (error: any) {
    // Don't log every failure - too verbose
    return { success: false, records: [] };
  }
}

// Data Cloud Queries - Check for Data Cloud configuration, retrievers, and search indexes
export async function getDataCloudInfo(conn: Connection): Promise<{
  isEnabled: boolean;
  dataSources: DataSourceRecord[];
  retrievers: RetrieverRecord[];
  searchIndexes: SearchIndexRecord[];
  debugInfo?: {
    availableObjects: string[];
    dataCloudObjects: string[];
    queriesAttempted: string[];
    errors: string[];
  };
  error?: string;
}> {
  const debugInfo = {
    availableObjects: [] as string[],
    dataCloudObjects: [] as string[],
    queriesAttempted: [] as string[],
    errors: [] as string[],
  };

  const result = {
    isEnabled: false,
    dataSources: [] as DataSourceRecord[],
    retrievers: [] as RetrieverRecord[],
    searchIndexes: [] as SearchIndexRecord[],
    debugInfo,
  };

  console.log('=== Starting Data Cloud detection ===');

  // Method 1: Check feature licenses (most reliable)
  try {
    const licenseQuery = `SELECT Name, Status, UsedLicenses, TotalLicenses
                          FROM UserLicense
                          WHERE Name LIKE '%Data Cloud%' OR Name LIKE '%Einstein%' OR Name LIKE '%CDP%'
                          LIMIT 10`;
    debugInfo.queriesAttempted.push(licenseQuery);
    const licenseResult = await safeQuery(conn, licenseQuery);
    if (licenseResult.success && licenseResult.records.length > 0) {
      console.log('✓ Data Cloud detected via feature license');
      console.log('Licenses found:', licenseResult.records.map((r: any) => r.Name));
      result.isEnabled = true;
    }
  } catch (error: any) {
    debugInfo.errors.push(`License check failed: ${error?.message}`);
  }

  // Method 2: Check permission set groups for Data Cloud
  try {
    const permSetQuery = `SELECT Id, DeveloperName, MasterLabel
                          FROM PermissionSetGroup
                          WHERE DeveloperName LIKE '%DataCloud%' OR DeveloperName LIKE '%CDP%'
                          LIMIT 10`;
    debugInfo.queriesAttempted.push(permSetQuery);
    const permSetResult = await safeQuery(conn, permSetQuery);
    if (permSetResult.success && permSetResult.records.length > 0) {
      console.log('✓ Data Cloud detected via permission set groups');
      result.isEnabled = true;
    }
  } catch (error: any) {
    debugInfo.errors.push(`PermissionSetGroup check failed: ${error?.message}`);
  }

  // Method 3: Get list of all available objects in the org
  try {
    const describe = await conn.describeGlobal();
    debugInfo.availableObjects = describe.sobjects.map(obj => obj.name);
    console.log(`Found ${debugInfo.availableObjects.length} total objects in org`);

    // Filter for Data Cloud related objects (broader search)
    debugInfo.dataCloudObjects = debugInfo.availableObjects.filter(name =>
      name.includes('DataCloud') ||
      name.includes('DataSource') ||
      name.includes('GenAi') ||
      name.includes('Einstein') ||
      name.includes('AI') ||
      name.includes('Search') ||
      name.includes('Retriever') ||
      name.includes('Vector') ||
      name.includes('CDP') ||
      name.includes('Lakehouse') ||
      name.includes('DataStream') ||
      name.includes('DataSpace')
    );
    console.log('Data Cloud related objects found:', debugInfo.dataCloudObjects);

    // If we found Data Cloud objects, mark as enabled
    if (debugInfo.dataCloudObjects.length > 0) {
      result.isEnabled = true;
      console.log('✓ Data Cloud detected via object discovery');
    }
  } catch (error: any) {
    const msg = `describeGlobal failed: ${error?.message || error}`;
    console.log(msg);
    debugInfo.errors.push(msg);
  }

  // Method 4: Check if Data Cloud is enabled by looking for key indicator objects
  const enabledIndicators = [
    'DataCloudTenant',
    'DataCloudDataSource',
    'DataSourceObject',
    'DataSourceTenant',
    'DataCloudAddress',
    'CdpQuery',
    'DataStreamDefinition',
    'DataLakeObject'
  ];

  for (const objName of enabledIndicators) {
    if (debugInfo.availableObjects.length === 0 || debugInfo.availableObjects.includes(objName)) {
      const query = `SELECT Id FROM ${objName} LIMIT 1`;
      debugInfo.queriesAttempted.push(query);
      const queryResult = await safeQuery(conn, query);
      if (queryResult.success) { // Object exists even if no records
        result.isEnabled = true;
        console.log(`✓ Data Cloud detected via ${objName}`);
        break;
      } else {
        debugInfo.errors.push(`${objName} query failed`);
      }
    }
  }

  // Try to get data sources - try multiple approaches
  const dataSourceObjects = [
    'ExternalDataSource',
    'NamedCredential',
    'DataCloudDataSource',
    'DataSourceTenant',
    'DataSourceObject',
    'DataStream',
    'DataStreamDefinition',
    'CdpConnector'
  ];

  for (const objName of dataSourceObjects) {
    if (debugInfo.availableObjects.length === 0 || debugInfo.availableObjects.includes(objName)) {
      // Try to get more fields if they exist
      const fields = ['Id', 'Name', 'DeveloperName', 'Status', 'Type'];
      const availableFields = fields.slice(0, 2); // Start with Id, Name
      const query = `SELECT ${availableFields.join(', ')} FROM ${objName} LIMIT 20`;
      debugInfo.queriesAttempted.push(query);
      const queryResult = await safeQuery(conn, query);
      if (queryResult.success && queryResult.records.length > 0) {
        console.log(`✓ Found ${queryResult.records.length} data sources in ${objName}`);
        result.dataSources = [...result.dataSources, ...queryResult.records];
        // Don't break - collect from multiple sources
      }
    }
  }

  // Also check tooling API for setup entities
  const toolingDataSourceQuery = `SELECT Id, DeveloperName, MasterLabel FROM SetupEntityAccess WHERE SetupEntityId IN (SELECT Id FROM SetupEntity WHERE DeveloperName LIKE '%DataCloud%') LIMIT 10`;
  debugInfo.queriesAttempted.push(toolingDataSourceQuery);
  const toolingDSResult = await safeQuery(conn, toolingDataSourceQuery, true);
  if (toolingDSResult.success && toolingDSResult.records.length > 0) {
    console.log(`✓ Found Data Cloud setup entities`);
  }

  console.log(`Data sources found: ${result.dataSources.length}`);

  // Check for GenAI Retrievers - try multiple approaches
  // Try 1: Standard API with full fields
  let retrieverQueries = [
    'SELECT Id, Name, DeveloperName, Type, Status FROM GenAiRetriever LIMIT 20',
    'SELECT Id, Name, DeveloperName FROM GenAiRetriever LIMIT 20',
    'SELECT Id, DeveloperName FROM GenAiRetriever LIMIT 20'
  ];

  for (const query of retrieverQueries) {
    debugInfo.queriesAttempted.push(query);
    const standardRetrieverResult = await safeQuery(conn, query);
    if (standardRetrieverResult.success && standardRetrieverResult.records.length > 0) {
      result.retrievers = standardRetrieverResult.records;
      console.log(`✓ Found ${result.retrievers.length} retrievers via standard API`);
      break;
    }
  }

  // Try 2: Tooling API if standard failed
  if (result.retrievers.length === 0) {
    const toolingRetrieverResult = await safeQuery(conn, 'SELECT Id, DeveloperName, MasterLabel FROM GenAiRetriever LIMIT 20', true);
    if (toolingRetrieverResult.success && toolingRetrieverResult.records.length > 0) {
      result.retrievers = toolingRetrieverResult.records.map((r: any) => ({
        Id: r.Id,
        Name: r.MasterLabel || r.DeveloperName || '',
        DeveloperName: r.DeveloperName,
      }));
      console.log(`✓ Found ${result.retrievers.length} retrievers via tooling API`);
    }
  }

  // Try 3: Check for retriever definition object
  if (result.retrievers.length === 0 && debugInfo.availableObjects.includes('GenAiRetrieverDefinition')) {
    const defQuery = 'SELECT Id, DeveloperName, MasterLabel FROM GenAiRetrieverDefinition LIMIT 20';
    debugInfo.queriesAttempted.push(defQuery);
    const defResult = await safeQuery(conn, defQuery);
    if (defResult.success && defResult.records.length > 0) {
      result.retrievers = defResult.records.map((r: any) => ({
        Id: r.Id,
        Name: r.MasterLabel || r.DeveloperName || '',
        DeveloperName: r.DeveloperName,
      }));
      console.log(`✓ Found ${result.retrievers.length} retrievers via GenAiRetrieverDefinition`);
    }
  }

  console.log(`Retrievers found: ${result.retrievers.length}`);

  // Check for Search Indexes - try multiple object names and approaches
  const searchIndexObjects = [
    'SearchIndex',
    'DataCloudSearchIndex',
    'VectorIndex',
    'DataCloudIndex',
    'EinsteinSearchIndex',
    'VectorSearchIndex'
  ];

  for (const objName of searchIndexObjects) {
    if (debugInfo.availableObjects.length === 0 || debugInfo.availableObjects.includes(objName)) {
      const queries = [
        `SELECT Id, Name, DeveloperName, Status FROM ${objName} LIMIT 20`,
        `SELECT Id, Name, DeveloperName FROM ${objName} LIMIT 20`,
        `SELECT Id, Name FROM ${objName} LIMIT 20`
      ];

      for (const query of queries) {
        debugInfo.queriesAttempted.push(query);
        const queryResult = await safeQuery(conn, query);
        if (queryResult.success && queryResult.records.length > 0) {
          console.log(`✓ Found ${queryResult.records.length} search indexes in ${objName}`);
          result.searchIndexes = [...result.searchIndexes, ...queryResult.records];
          break; // Move to next object type
        }
      }
    }
  }

  // Try tooling API for indexes
  if (result.searchIndexes.length === 0) {
    const toolingIndexQuery = 'SELECT Id, DeveloperName, MasterLabel FROM SearchIndex LIMIT 20';
    debugInfo.queriesAttempted.push(toolingIndexQuery);
    const toolingIndexResult = await safeQuery(conn, toolingIndexQuery, true);
    if (toolingIndexResult.success && toolingIndexResult.records.length > 0) {
      result.searchIndexes = toolingIndexResult.records.map((r: any) => ({
        Id: r.Id,
        Name: r.MasterLabel || r.DeveloperName || '',
        DeveloperName: r.DeveloperName,
      }));
      console.log(`✓ Found ${result.searchIndexes.length} search indexes via tooling API`);
    }
  }

  console.log('=== Data Cloud scan complete ===');
  console.log(`Data Cloud Enabled: ${result.isEnabled}`);
  console.log(`Data Sources: ${result.dataSources.length}`);
  console.log(`Retrievers: ${result.retrievers.length}`);
  console.log(`Search Indexes: ${result.searchIndexes.length}`);

  return result;
}

// Check if agent topics are connected to Data Cloud data sources
export async function getDataCloudConnections(
  conn: Connection,
  topicIds: string[]
): Promise<any[]> {
  if (topicIds.length === 0) return [];

  // This would check for data source connections to topics
  // The exact object/relationship may vary based on Salesforce implementation
  try {
    // Try to find data cloud connections (this is a placeholder - actual object names may differ)
    const query = `
      SELECT Id, Name
      FROM GenAiPluginDataSource
      WHERE GenAiPluginId IN (${topicIds.map(id => `'${id}'`).join(',')})
      LIMIT 50
    `;
    const result = await conn.query(query);
    return result.records || [];
  } catch (error) {
    // Object may not exist or no permissions
    return [];
  }
}

// Check Agentforce permissions and configuration
export async function checkAgentforcePermissions(
  conn: Connection,
  userId?: string
): Promise<{
  hasAgentforceAccess: boolean;
  permissionSets: any[];
  missingPermissions: string[];
  recommendations: string[];
}> {
  const result = {
    hasAgentforceAccess: false,
    permissionSets: [] as any[],
    missingPermissions: [] as string[],
    recommendations: [] as string[],
  };

  try {
    // Check for Agentforce-related permission sets in the org
    const permSetQuery = `
      SELECT Id, Name, Label, Description
      FROM PermissionSet
      WHERE Name LIKE '%Agent%' OR Name LIKE '%GenAi%' OR Name LIKE '%Einstein%'
      LIMIT 50
    `;
    const permSetResult = await conn.query(permSetQuery);
    result.permissionSets = permSetResult.records || [];
    console.log(`Found ${result.permissionSets.length} Agentforce-related permission sets`);

    // Check if user has required permissions (if userId provided)
    if (userId) {
      const userPermQuery = `
        SELECT PermissionSet.Name, PermissionSet.Label
        FROM PermissionSetAssignment
        WHERE AssigneeId = '${userId}'
        AND (PermissionSet.Name LIKE '%Agent%' OR PermissionSet.Name LIKE '%GenAi%')
      `;
      const userPermResult = await conn.query(userPermQuery);

      if (userPermResult.records && userPermResult.records.length > 0) {
        result.hasAgentforceAccess = true;
        console.log(`User has ${userPermResult.records.length} Agentforce permission assignments`);
      } else {
        result.missingPermissions.push('No Agentforce permission sets assigned to current user');
        result.recommendations.push('Assign "Agents User" or similar permission set to access Agentforce features');
      }
    }

    // Check for required object permissions
    const requiredObjects = ['GenAiPlannerBundle', 'GenAiPlugin', 'GenAiFunction'];
    for (const objName of requiredObjects) {
      try {
        await conn.query(`SELECT Id FROM ${objName} LIMIT 1`);
        console.log(`✓ User has access to ${objName}`);
      } catch (error: any) {
        if (error.errorCode === 'INVALID_TYPE' || error.message?.includes('sObject type')) {
          result.missingPermissions.push(`${objName} object not available (may need Agentforce license)`);
        } else {
          result.missingPermissions.push(`No read permission on ${objName}`);
          result.recommendations.push(`Grant read access to ${objName} via permission set`);
        }
      }
    }

  } catch (error: any) {
    console.error('Permission check failed:', error.message);
  }

  return result;
}
