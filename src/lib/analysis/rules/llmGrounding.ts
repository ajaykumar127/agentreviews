import type { AgentAnalysisData, Finding } from '../types';

export function analyzeLlmGrounding(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { bot, actionMetadata } = data;

  // Check if actions have proper response handling (important for grounding action results)
  const actionsWithoutResponseHandling = actionMetadata.filter(
    (a) => {
      const hasOutputParams = a.genAiFunctionOutputs && a.genAiFunctionOutputs.length > 0;
      return !hasOutputParams;
    }
  );

  if (actionsWithoutResponseHandling.length > 0 && actionMetadata.length > 0) {
    findings.push({
      id: 'GROUND-002',
      category: 'llmGrounding',
      stage: 'monitor',
      severity: 'info',
      title: 'Actions with no output parameters',
      description: `${actionsWithoutResponseHandling.length} of ${actionMetadata.length} action(s) have no output parameters defined. The agent may not be able to effectively use action results in conversations.`,
      recommendation: 'Define output parameters for actions to enable the agent to ground responses in action results (e.g., order status, account details).',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Runtime monitoring recommendation
  findings.push({
    id: 'GROUND-003',
    category: 'llmGrounding',
    stage: 'monitor',
    severity: 'info',
    title: 'Monitor hallucination and accuracy',
    description: 'After deployment, monitor agent responses for hallucinations, factual errors, and data freshness issues.',
    recommendation: 'Use Einstein Copilot Studio Analytics to track response quality, user satisfaction, and identify topics that need better grounding or additional data sources.',
    affectedComponent: `Agent: ${bot.MasterLabel}`,
  });

  return findings;
}
