import type { AgentAnalysisData, Finding } from '../types';

export function analyzeAgentDefinition(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { bot, botVersion, botVersionMetadata } = data;

  // Check description quality
  if (!bot.Description || bot.Description.trim().length === 0) {
    findings.push({
      id: 'AGENTDEF-001',
      category: 'agentDefinition',
      stage: 'designSetup',
      severity: 'critical',
      title: 'Agent missing description',
      description: `Agent "${bot.MasterLabel}" has no description. A clear description helps developers and admins understand the agent's purpose and scope.`,
      recommendation: 'Add a comprehensive description that explains what the agent does, its target users, and its primary use cases.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  } else if (bot.Description.trim().length < 50) {
    findings.push({
      id: 'AGENTDEF-002',
      category: 'agentDefinition',
      stage: 'designSetup',
      severity: 'warning',
      title: 'Agent description too brief',
      description: `Agent "${bot.MasterLabel}" has a description under 50 characters. This may not provide enough context about the agent's purpose.`,
      recommendation: 'Expand the description to include: agent purpose, target users, primary capabilities, and scope boundaries.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Check active version exists
  if (!botVersion || botVersion.Status !== 'Active') {
    findings.push({
      id: 'AGENTDEF-003',
      category: 'agentDefinition',
      stage: 'designSetup',
      severity: 'critical',
      title: 'No active version exists',
      description: `Agent "${bot.MasterLabel}" has no active version. The agent cannot function without an active version.`,
      recommendation: 'Activate a bot version before deploying the agent to production.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  return findings;
}
