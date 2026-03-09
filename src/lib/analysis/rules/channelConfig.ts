import type { AgentAnalysisData, Finding } from '../types';

export function analyzeChannelConfig(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { botMetadata } = data;

  const channels = botMetadata?.botChannels || [];

  if (channels.length === 0) {
    findings.push({
      id: 'CHAN-001',
      category: 'channelConfig',
      stage: 'configuration',
      severity: 'warning',
      title: 'No channel configuration',
      description: 'The agent has no channel configurations. It may not be deployed to any customer-facing channel.',
      recommendation: 'Configure at least one deployment channel (e.g., Web Chat, Messaging, Slack).',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  } else if (channels.length === 1) {
    findings.push({
      id: 'CHAN-002',
      category: 'channelConfig',
      stage: 'configuration',
      severity: 'info',
      title: 'Single channel deployment',
      description: `Agent is configured for only one channel: ${channels[0].channel || channels[0].channelLabel || 'Unknown'}.`,
      recommendation: 'Consider deploying to additional channels for broader customer reach.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  return findings;
}
