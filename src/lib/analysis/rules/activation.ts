import type { AgentAnalysisData, Finding } from '../types';

export function analyzeActivation(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { bot, botVersion, channelDeployments } = data;

  // Check if there's an active bot version
  if (!botVersion || botVersion.Status !== 'Active') {
    findings.push({
      id: 'ACTIV-001',
      category: 'activation',
      stage: 'deploy',
      severity: 'critical',
      title: 'No active bot version',
      description: `Agent "${bot.MasterLabel}" has no active version. The agent cannot serve users without an active version deployed.`,
      recommendation: 'Activate a bot version in the Agent Builder before deploying to production channels.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Check channel deployments
  if (channelDeployments.length === 0) {
    findings.push({
      id: 'ACTIV-002',
      category: 'activation',
      stage: 'deploy',
      severity: 'warning',
      title: 'No channels configured',
      description: `Agent "${bot.MasterLabel}" has no channels configured. Users cannot interact with the agent without a deployment channel.`,
      recommendation: 'Deploy the agent to at least one channel: Experience Cloud, Messaging for In-App and Web, Einstein Bots, or Slack.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  } else {
    // Check if all channels are inactive
    const activeChannels = channelDeployments.filter(c => c.IsActive);
    if (activeChannels.length === 0) {
      findings.push({
        id: 'ACTIV-003',
        category: 'activation',
        stage: 'deploy',
        severity: 'warning',
        title: 'All channels inactive',
        description: `Agent "${bot.MasterLabel}" has ${channelDeployments.length} channel(s) configured but none are active.`,
        recommendation: 'Activate at least one channel deployment to make the agent accessible to users.',
        affectedComponent: `Agent: ${bot.MasterLabel}`,
      });
    }

    // Provide channel-specific recommendations
    const channelTypes = channelDeployments.map(c => c.ChannelType).filter(Boolean);
    if (channelTypes.length > 0) {
      findings.push({
        id: 'ACTIV-004',
        category: 'activation',
        stage: 'deploy',
        severity: 'info',
        title: 'Channel-specific best practices',
        description: `Agent is deployed to: ${channelTypes.join(', ')}. Each channel has specific character limits and UX considerations.`,
        recommendation: 'Review channel-specific guidelines: Experience Cloud (supports rich media), Messaging (optimized for mobile), Slack (supports slash commands and buttons).',
        affectedComponent: `Agent: ${bot.MasterLabel}`,
      });
    }
  }

  return findings;
}
