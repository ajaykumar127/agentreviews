import type { AgentAnalysisData, Finding } from '../types';

export function analyzeActionsConfig(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { actionMetadata, actions } = data;

  if (actions.length === 0) {
    findings.push({
      id: 'ACT-000',
      category: 'actionsConfig',
      stage: 'configuration',
      severity: 'critical',
      title: 'No actions found',
      description: 'No Agentforce actions (GenAiFunction) were found in this org.',
      recommendation: 'Create actions that the agent can invoke to perform tasks.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
    return findings;
  }

  // Track actions with common issues for consolidation
  const actionsMissingDescription: string[] = [];
  const actionsMissingInputs: string[] = [];
  const actionsMissingOutputs: string[] = [];

  for (const action of actionMetadata) {
    const name = action.masterLabel || action.fullName;

    // Collect actions missing description
    if (!action.description || action.description.trim().length === 0) {
      actionsMissingDescription.push(name);
    }

    // Collect actions with no inputs
    const inputs = action.genAiFunctionInputs || [];
    if (inputs.length === 0) {
      actionsMissingInputs.push(name);
    }

    // Collect actions with no outputs
    const outputs = action.genAiFunctionOutputs || [];
    if (outputs.length === 0) {
      actionsMissingOutputs.push(name);
    }

    // Check for input params missing descriptions
    for (const input of inputs) {
      if (!input.description || input.description.trim().length === 0) {
        findings.push({
          id: 'ACT-004',
          category: 'actionsConfig',
          stage: 'configuration',
          severity: 'warning',
          title: 'Input parameter missing description',
          description: `Action "${name}" has input parameter "${input.name}" without a description.`,
          recommendation: 'Add a description to help the LLM understand what value to pass.',
          affectedComponent: `Action: ${name} > Input: ${input.name}`,
        });
        break; // Only report once per action
      }
    }
  }

  // Add consolidated findings for actions
  if (actionsMissingDescription.length > 0) {
    findings.push({
      id: 'ACT-001',
      category: 'actionsConfig',
      stage: 'configuration',
      severity: 'critical',
      title: `${actionsMissingDescription.length} action(s) missing description`,
      description: `The following actions have no description: ${actionsMissingDescription.map(a => `"${a}"`).join(', ')}. The Atlas Reasoning Engine cannot properly select these actions without descriptions.`,
      recommendation: 'Add clear descriptions explaining what each action does and when it should be used.',
      affectedComponent: `Actions: ${actionsMissingDescription.join(', ')}`,
    });
  }

  if (actionsMissingInputs.length > 0) {
    findings.push({
      id: 'ACT-002',
      category: 'actionsConfig',
      stage: 'configuration',
      severity: 'warning',
      title: `${actionsMissingInputs.length} action(s) have no input parameters`,
      description: `The following actions have no input parameters defined: ${actionsMissingInputs.map(a => `"${a}"`).join(', ')}.`,
      recommendation: 'Define input parameters with types and descriptions if these actions require data.',
      affectedComponent: `Actions: ${actionsMissingInputs.join(', ')}`,
    });
  }

  if (actionsMissingOutputs.length > 0) {
    findings.push({
      id: 'ACT-003',
      category: 'actionsConfig',
      stage: 'configuration',
      severity: 'warning',
      title: `${actionsMissingOutputs.length} action(s) have no output parameters`,
      description: `The following actions have no output parameters defined: ${actionsMissingOutputs.map(a => `"${a}"`).join(', ')}.`,
      recommendation: 'Define output parameters so the agent knows what data to expect back from each action.',
      affectedComponent: `Actions: ${actionsMissingOutputs.join(', ')}`,
    });
  }

  // Check for duplicate/similar action labels
  const validActions = actionMetadata.filter((a) => a.masterLabel || a.fullName);
  const labels = validActions.map((a) => (a.masterLabel || a.fullName || '').toLowerCase());

  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const prefix1 = labels[i].split(/[\s_]/)[0];
      const prefix2 = labels[j].split(/[\s_]/)[0];
      if (prefix1 === prefix2 && prefix1.length > 2) {
        const action1Name = validActions[i].masterLabel || validActions[i].fullName || 'Unknown';
        const action2Name = validActions[j].masterLabel || validActions[j].fullName || 'Unknown';
        findings.push({
          id: 'ACT-006',
          category: 'actionsConfig',
          stage: 'configuration',
          severity: 'warning',
          title: 'Similar action labels',
          description: `Actions "${action1Name}" and "${action2Name}" start with the same prefix "${prefix1}". This may confuse action routing.`,
          recommendation: 'Differentiate action labels with distinct verbs or prefixes.',
          affectedComponent: `Actions: ${action1Name}, ${action2Name}`,
        });
        break;
      }
    }
  }

  // SALESFORCE GUIDELINE: Check for topics with >5 actions
  const { topicMetadata } = data;
  for (const topic of topicMetadata) {
    const topicActions = topic.genAiFunctions || [];
    if (topicActions.length > 5) {
      const topicName = topic.masterLabel || topic.fullName;
      findings.push({
        id: 'ACT-007',
        category: 'actionsConfig',
        stage: 'configuration',
        severity: 'warning',
        title: 'Topic has too many actions (>5)',
        description: `Topic "${topicName}" has ${topicActions.length} actions. Salesforce recommends maximum 5 actions per topic to reduce latency and complexity.`,
        recommendation: 'Consolidate actions, remove unused actions, or split this topic into multiple focused topics. Having too many actions increases response time and makes the agent harder to maintain.',
        affectedComponent: `Topic: ${topicName}`,
      });
    }
  }

  return findings;
}
