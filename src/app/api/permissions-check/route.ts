import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedConnection, jsonError } from '@/lib/api';

interface PermissionCheck {
  permission: string;
  status: string;
  error?: string;
}

interface ObjectCheck {
  object: string;
  api: string;
  accessible: boolean;
  recordCount?: number;
  error?: any;
}

interface Recommendation {
  severity: string;
  title: string;
  message: string;
  objects?: any[];
  solution: string | string[];
}

export async function POST(request: NextRequest) {
  const auth = getAuthenticatedConnection(request);
  if (!auth.ok) return auth.response;
  const { conn, session } = auth;

  try {
    console.log('=== Starting Permissions Diagnostic ===');

    const results: {
      userInfo: any;
      permissions: PermissionCheck[];
      accessibleObjects: ObjectCheck[];
      missingPermissions: string[];
      recommendations: Recommendation[];
    } = {
      userInfo: {},
      permissions: [],
      accessibleObjects: [],
      missingPermissions: [],
      recommendations: [],
    };

    // Get user info
    try {
      const userInfo = await conn.identity();
      results.userInfo = {
        userId: userInfo.user_id,
        username: userInfo.username,
        displayName: userInfo.display_name,
        orgId: userInfo.organization_id,
      };
    } catch (error: any) {
      results.missingPermissions.push('Unable to fetch user identity');
    }

    // Check critical permissions (use userId from session)
    const userId = session.userId;
    const permissionChecks = [
      { name: 'View All Data', query: `SELECT Id FROM PermissionSetAssignment WHERE PermissionSet.Name = 'ViewAllData' AND AssigneeId = '${userId}' LIMIT 1` },
      { name: 'Modify All Data', query: `SELECT Id FROM PermissionSetAssignment WHERE PermissionSet.Name = 'ModifyAllData' AND AssigneeId = '${userId}' LIMIT 1` },
      { name: 'API Enabled', query: `SELECT Id FROM User WHERE Id = '${userId}' AND IsActive = true LIMIT 1` },
    ];

    for (const check of permissionChecks) {
      try {
        const result = await conn.query(check.query);
        results.permissions.push({
          permission: check.name,
          status: result.totalSize > 0 ? 'GRANTED' : 'NOT FOUND',
        });
      } catch (error) {
        results.permissions.push({
          permission: check.name,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Check Agentforce/Einstein object accessibility
    const agentforceObjects = [
      'GenAiPlannerBundle',
      'GenAiPlugin',
      'GenAiPluginDefinition',
      'GenAiFunction',
      'GenAiFunctionDefinition',
      'GenAiRetriever',
      'BotDefinition',
      'BotVersion',
      'AiEvaluationDefinition',
      'DataCloudTenant',
      'SearchIndex',
    ];

    for (const objName of agentforceObjects) {
      try {
        // Try standard API
        const result = await conn.query(`SELECT Id FROM ${objName} LIMIT 1`);
        results.accessibleObjects.push({
          object: objName,
          api: 'Standard',
          accessible: true,
          recordCount: result.totalSize,
        });
      } catch (standardError: any) {
        // Try Tooling API
        try {
          const toolingResult = await conn.tooling.query(`SELECT Id FROM ${objName} LIMIT 1`);
          results.accessibleObjects.push({
            object: objName,
            api: 'Tooling',
            accessible: true,
            recordCount: toolingResult.totalSize,
          });
        } catch (toolingError: any) {
          results.accessibleObjects.push({
            object: objName,
            api: 'None',
            accessible: false,
            error: toolingError.errorCode || toolingError.message || 'Unknown',
          });
        }
      }
    }

    // Generate recommendations
    const inaccessibleObjects = results.accessibleObjects.filter(o => !o.accessible);
    if (inaccessibleObjects.length > 0) {
      results.recommendations.push({
        severity: 'high',
        title: 'Missing Object Access',
        message: `Cannot access ${inaccessibleObjects.length} Agentforce objects. This will limit analysis depth.`,
        objects: inaccessibleObjects.map(o => o.object),
        solution: 'Ensure user has "View All Data" permission or assign Agentforce-specific permission sets.',
      });
    }

    // Check for Einstein/Agentforce feature enablement
    const missingCriticalObjects = inaccessibleObjects.filter(o =>
      ['GenAiPlannerBundle', 'GenAiPlugin', 'GenAiFunction'].includes(o.object)
    );

    if (missingCriticalObjects.length > 0) {
      results.recommendations.push({
        severity: 'critical',
        title: 'Agentforce Not Enabled or Not Accessible',
        message: 'Cannot access core Agentforce objects (GenAiPlannerBundle, GenAiPlugin, GenAiFunction).',
        solution: [
          '1. Verify Einstein Agentforce is enabled in Setup → Einstein Setup → Einstein Generative AI',
          '2. Ensure user has "Einstein Generative AI User" permission',
          '3. Assign "Agentforce Agent Builder" permission set',
          '4. Verify API Enabled permission on user profile',
        ],
      });
    }

    // Check Data Cloud
    const dataCloudObjects = results.accessibleObjects.filter(o =>
      o.object.includes('DataCloud') || o.object === 'SearchIndex' || o.object === 'GenAiRetriever'
    );
    const dataCloudAccessible = dataCloudObjects.some(o => o.accessible);

    if (!dataCloudAccessible) {
      results.recommendations.push({
        severity: 'medium',
        title: 'Data Cloud Not Accessible',
        message: 'Cannot access Data Cloud objects. Data stage analysis will be limited.',
        solution: 'Enable Data Cloud and ensure user has Data Cloud User permission.',
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Permissions check error:', error);
    return jsonError(error instanceof Error ? error.message : 'Permission check failed', 500);
  }
}
