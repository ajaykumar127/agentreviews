import type { AgentAnalysisData, Finding } from '../types';

export function analyzeErrorHandling(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { topicMetadata, actionMetadata, botVersionMetadata } = data;

  const allInstructions = topicMetadata
    .flatMap((t) => (t.instructions || []).map((i) => i.instruction))
    .join(' ');

  // Check for error/fallback mentions in instructions
  const errorKeywords = /\b(error|fail|unable|cannot|sorry|apologize|fallback|retry|try again|issue|problem|unavailable)\b/i;
  if (!errorKeywords.test(allInstructions)) {
    findings.push({
      id: 'ERR-001',
      category: 'errorHandling',
      stage: 'configuration',
      severity: 'critical',
      title: 'No error handling in instructions',
      description: 'No topic instructions mention error scenarios, failures, or fallback behavior.',
      recommendation: 'Add instructions for error handling (e.g., "If the action fails, apologize and offer to try again or escalate to a human agent").',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for actions with error outputs
  const actionsWithErrorOutput = actionMetadata.filter((a) => {
    const outputs = a.genAiFunctionOutputs || [];
    return outputs.some((o) => /error|fault|exception|status/i.test(o.name));
  });

  if (actionMetadata.length > 0 && actionsWithErrorOutput.length === 0) {
    findings.push({
      id: 'ERR-002',
      category: 'errorHandling',
      stage: 'configuration',
      severity: 'warning',
      title: 'No actions define error outputs',
      description: 'No actions have output parameters that indicate error states.',
      recommendation: 'Add error/status output parameters to actions so the agent can detect and handle failures.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for context/conversation variables tracking error state
  const contextVars = botVersionMetadata?.conversationVariables || [];
  const hasErrorVar = contextVars.some((v) => /error|fault|retry|status/i.test(v.developerName));
  if (!hasErrorVar && contextVars.length > 0) {
    findings.push({
      id: 'ERR-003',
      category: 'errorHandling',
      stage: 'configuration',
      severity: 'warning',
      title: 'No error tracking variable',
      description: 'No conversation variable appears to track error state.',
      recommendation: 'Add a context variable for error tracking to enable recovery logic.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  return findings;
}
