import type { AgentAnalysisData, Finding } from '../types';

export function analyzeSecurity(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { bot, topicMetadata, actionMetadata } = data;

  // Check for broad data access mentions
  const broadAccessKeywords = /\b(all records|all data|full access|admin|system.?admin|unrestricted|no.?restriction)\b/i;
  const allText = [
    bot.Description || '',
    ...topicMetadata.map((t) => t.description || ''),
    ...topicMetadata.map((t) => t.scope || ''),
    ...actionMetadata.map((a) => a.description || ''),
  ].join(' ');

  if (broadAccessKeywords.test(allText)) {
    findings.push({
      id: 'SEC-001',
      category: 'security',
      stage: 'configuration',
      severity: 'warning',
      title: 'Broad data access detected',
      description: 'Agent configuration mentions broad or unrestricted data access. This violates the principle of least privilege.',
      recommendation: 'Apply minimum-permission principle. Use dedicated permission sets that grant only the data access the agent needs.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for permission set mentions (informational)
  const permKeywords = /\b(permission.?set|profile|role|sharing.?rule|field.?level)\b/i;
  if (!permKeywords.test(allText)) {
    findings.push({
      id: 'SEC-002',
      category: 'security',
      stage: 'configuration',
      severity: 'info',
      title: 'No permission set references in configuration',
      description: 'No references to permission sets or security configurations were found in the agent metadata.',
      recommendation: 'Verify that appropriate permission sets are configured for the agent user in Salesforce Setup.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  return findings;
}
