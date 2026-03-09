import type { AgentAnalysisData, Finding } from '../types';

export function analyzeGuardrails(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { topicMetadata, topics } = data;

  const allInstructions = topicMetadata
    .flatMap((t) => (t.instructions || []).map((i) => i.instruction))
    .join(' ');
  const allScopes = topicMetadata.map((t) => t.scope || '').join(' ');

  // Check for PII/data handling mentions
  const dataKeywords = /\b(pii|personal.?data|sensitive|confidential|privacy|gdpr|hipaa|ssn|social.?security|credit.?card|account.?number)\b/i;
  if (!dataKeywords.test(allInstructions) && !dataKeywords.test(allScopes)) {
    findings.push({
      id: 'GUARD-001',
      category: 'guardrails',
      stage: 'configuration',
      severity: 'warning',
      title: 'No data handling guidance',
      description: 'No topic instructions or scopes mention data handling, PII, or sensitive information policies.',
      recommendation: 'Add instructions about handling sensitive customer data (e.g., "Never display full credit card numbers. Mask sensitive data in responses").',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for scope restrictions
  const hasScope = topicMetadata.some((t) => t.scope && t.scope.trim().length > 0);
  if (!hasScope) {
    findings.push({
      id: 'GUARD-002',
      category: 'guardrails',
      stage: 'configuration',
      severity: 'warning',
      title: 'No scope restrictions defined',
      description: 'No topics have scope boundaries defined. Without scope, the agent has no explicit constraints on behavior.',
      recommendation: 'Define scope for each topic to limit what the agent can and cannot do.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for identity verification
  const authKeywords = /\b(verify|authenticate|identity|confirm.?identity|validate.?user|login|credentials|security.?question)\b/i;
  if (!authKeywords.test(allInstructions)) {
    findings.push({
      id: 'GUARD-003',
      category: 'guardrails',
      stage: 'configuration',
      severity: 'info',
      title: 'No identity verification referenced',
      description: 'No instructions mention verifying customer identity before performing sensitive operations.',
      recommendation: 'Consider adding identity verification steps before actions that access or modify customer data.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check topic count (complexity risk)
  if (topics.length > 10) {
    findings.push({
      id: 'GUARD-004',
      category: 'guardrails',
      stage: 'configuration',
      severity: 'warning',
      title: 'High topic count (complexity risk)',
      description: `Agent has ${topics.length} topics. A large number of topics increases routing complexity and error risk.`,
      recommendation: 'Consider consolidating related topics or splitting into multiple specialized agents.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  return findings;
}
