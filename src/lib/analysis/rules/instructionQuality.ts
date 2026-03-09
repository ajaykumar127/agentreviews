import type { AgentAnalysisData, Finding } from '../types';
import {
  countAbsoluteTerms,
  countNegations,
  hasActionVerbs,
  referencesActionNames,
} from '../../utils/textAnalysis';

export function analyzeInstructionQuality(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { topicMetadata, actionMetadata } = data;
  const actionNames = actionMetadata
    .filter((a) => a.fullName)
    .map((a) => a.fullName);

  // Collect topics with no instructions first (consolidate into one finding)
  const topicsWithNoInstructions: string[] = [];

  for (const topic of topicMetadata) {
    const name = topic.masterLabel || topic.fullName;
    const instructions = topic.instructions || [];

    if (instructions.length === 0) {
      topicsWithNoInstructions.push(name);
      continue;
    }

    // Check sequencing
    const sequences = instructions.map((i) => i.sequence);
    const allZero = sequences.every((s) => s === 0);
    if (allZero && instructions.length > 1) {
      findings.push({
        id: 'INSTR-002',
        category: 'instructionQuality',
        stage: 'configuration',
        severity: 'warning',
        title: 'Instructions not sequenced',
        description: `Topic "${name}" has ${instructions.length} instructions but none are numbered/sequenced.`,
        recommendation: 'Number instructions in logical order to ensure the agent follows the correct conversation flow.',
        affectedComponent: `Topic: ${name}`,
      });
    }

    const fullText = instructions.map((i) => i.instruction).join(' ');

    // Check for excessive absolute terms
    const absoluteCount = countAbsoluteTerms(fullText);
    if (absoluteCount > 3) {
      findings.push({
        id: 'INSTR-003',
        category: 'instructionQuality',
        stage: 'configuration',
        severity: 'warning',
        title: 'Excessive absolute language in instructions',
        description: `Topic "${name}" instructions contain ${absoluteCount} absolute terms ("must", "never", "always"). Overuse of strict mandates can cause the agent to get stuck.`,
        recommendation: 'Reduce absolute language. Use softer guidance like "prefer", "typically", "when possible" for non-critical rules.',
        affectedComponent: `Topic: ${name}`,
      });
    }

    // Check for negation-heavy instructions
    const negationCount = countNegations(fullText);
    if (negationCount > 2) {
      findings.push({
        id: 'INSTR-004',
        category: 'instructionQuality',
        stage: 'configuration',
        severity: 'warning',
        title: 'Negation-heavy instructions',
        description: `Topic "${name}" instructions contain ${negationCount} negation patterns ("don't", "do not", "never"). Negative instructions are harder for the LLM to follow.`,
        recommendation: 'Rewrite as positive instructions stating what the agent SHOULD do instead of what it shouldn\'t.',
        affectedComponent: `Topic: ${name}`,
      });
    }

    // Check if instructions reference action names
    if (actionNames.length > 0 && !referencesActionNames(fullText, actionNames)) {
      findings.push({
        id: 'INSTR-005',
        category: 'instructionQuality',
        stage: 'configuration',
        severity: 'warning',
        title: 'Instructions do not reference action names',
        description: `Topic "${name}" instructions don't reference any specific action names. Without exact action references, the agent may not invoke the correct actions.`,
        recommendation: 'Reference specific action names in instructions (e.g., "Use the Get_Order_Status action to retrieve the customer\'s order").',
        affectedComponent: `Topic: ${name}`,
      });
    }

    // Check total length
    if (fullText.length > 2000) {
      findings.push({
        id: 'INSTR-006',
        category: 'instructionQuality',
        stage: 'configuration',
        severity: 'info',
        title: 'Instructions are very long',
        description: `Topic "${name}" has ${fullText.length} characters of instructions. Overly complex instructions can reduce reliability.`,
        recommendation: 'Simplify instructions or break complex logic into separate topics/actions.',
        affectedComponent: `Topic: ${name}`,
      });
    }

    // Check for action verbs
    if (!hasActionVerbs(fullText)) {
      findings.push({
        id: 'INSTR-007',
        category: 'instructionQuality',
        stage: 'configuration',
        severity: 'warning',
        title: 'Instructions lack action verbs',
        description: `Topic "${name}" instructions don't contain clear imperative verbs like "retrieve", "create", "verify", "escalate".`,
        recommendation: 'Use strong action verbs to give the agent clear directives.',
        affectedComponent: `Topic: ${name}`,
      });
    }

    // Single instruction block
    if (instructions.length === 1 && fullText.length > 100) {
      findings.push({
        id: 'INSTR-008',
        category: 'instructionQuality',
        stage: 'configuration',
        severity: 'info',
        title: 'Single instruction block',
        description: `Topic "${name}" has all instructions in a single block rather than discrete steps.`,
        recommendation: 'Break instructions into ordered steps for better agent compliance.',
        affectedComponent: `Topic: ${name}`,
      });
    }
  }

  // Add consolidated finding for topics with no instructions
  if (topicsWithNoInstructions.length > 0) {
    findings.push({
      id: 'INSTR-001',
      category: 'instructionQuality',
      stage: 'configuration',
      severity: 'critical',
      title: `${topicsWithNoInstructions.length} topic(s) have no instructions`,
      description: `The following topics have zero instructions defined: ${topicsWithNoInstructions.map(t => `"${t}"`).join(', ')}. The agent has no guidance on how to behave within these topics.`,
      recommendation: 'Add step-by-step instructions to each topic that guide the agent through the expected conversation flow for that topic.',
      affectedComponent: `Topics: ${topicsWithNoInstructions.join(', ')}`,
    });
  }

  return findings;
}
