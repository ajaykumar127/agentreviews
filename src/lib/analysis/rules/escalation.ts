import type { AgentAnalysisData, Finding } from '../types';

export function analyzeEscalation(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { topicMetadata, actionMetadata } = data;

  // Check if any topic is escalation-related
  const escalationKeywords = /escalat|handoff|hand.?off|transfer|human|agent.?transfer|live.?agent/i;
  const escalationTopics = topicMetadata.filter(
    (t) =>
      escalationKeywords.test(t.fullName) ||
      escalationKeywords.test(t.masterLabel) ||
      escalationKeywords.test(t.classificationDescription || '') ||
      escalationKeywords.test(t.description || '')
  );

  if (escalationTopics.length === 0) {
    findings.push({
      id: 'ESC-001',
      category: 'escalation',
      stage: 'configuration',
      severity: 'critical',
      title: 'No escalation topic found',
      description: 'No topic appears to handle escalation to a human agent. Customers may get stuck without a way to reach a live agent.',
      recommendation: 'Create a dedicated Escalation topic with classification like "Use when the customer requests a human agent or the bot cannot resolve the issue".',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  } else {
    // Check if escalation topics have actions
    for (const topic of escalationTopics) {
      const linkedActions = topic.genAiFunctions || [];
      if (linkedActions.length === 0) {
        findings.push({
          id: 'ESC-002',
          category: 'escalation',
          stage: 'configuration',
          severity: 'warning',
          title: 'Escalation topic has no actions',
          description: `Escalation topic "${topic.masterLabel}" exists but has no linked actions to perform the actual handoff.`,
          recommendation: 'Add a transfer/handoff action (e.g., Transfer_To_Agent) to the escalation topic.',
          affectedComponent: `Topic: ${topic.masterLabel}`,
        });
      }
    }
  }

  // Check if any instructions across all topics mention escalation
  const allInstructions = topicMetadata
    .flatMap((t) => (t.instructions || []).map((i) => i.instruction))
    .join(' ');

  if (!escalationKeywords.test(allInstructions)) {
    findings.push({
      id: 'ESC-003',
      category: 'escalation',
      stage: 'configuration',
      severity: 'warning',
      title: 'No escalation guidance in instructions',
      description: 'No topic instructions mention escalation, transfer, or handoff scenarios.',
      recommendation: 'Add instructions guiding the agent on when to escalate (e.g., "If the customer asks to speak to a human, use the Transfer_To_Agent action").',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for escalation actions
  const escalationActions = actionMetadata.filter(
    (a) =>
      escalationKeywords.test(a.fullName) ||
      escalationKeywords.test(a.masterLabel) ||
      escalationKeywords.test(a.description || '')
  );

  if (escalationActions.length === 0 && escalationTopics.length > 0) {
    findings.push({
      id: 'ESC-004',
      category: 'escalation',
      stage: 'configuration',
      severity: 'info',
      title: 'No dedicated escalation action found',
      description: 'An escalation topic exists but no specific escalation/transfer action was found.',
      recommendation: 'Create a dedicated transfer action for structured handoff to human agents.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  return findings;
}
