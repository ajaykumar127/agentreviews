import type { AgentAnalysisData, Finding } from '../types';

/**
 * Agent Script & Determinism Analyzer
 *
 * Checks agent configuration against Salesforce's 6 Levels of Determinism:
 * Level 1: Instruction-Free (baseline autonomy)
 * Level 2: Agent Instructions (policy guidance)
 * Level 3: Data Grounding (external knowledge)
 * Level 4: Agent Variables (state management)
 * Level 5: Deterministic Actions (Apex/Flows)
 * Level 6: Agent Script (hard-coded paths)
 *
 * References:
 * - https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html
 * - https://www.salesforce.com/agentforce/levels-of-determinism/
 */
export function analyzeAgentScriptDeterminism(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { bot, botMetadata, topicMetadata, actionMetadata, actions } = data;

  // Level 4 Check: Agent Variables (Context Variables)
  const hasContextVariables = botMetadata?.contextVariables && botMetadata.contextVariables.length > 0;

  if (!hasContextVariables) {
    findings.push({
      id: 'SCRIPT-001',
      category: 'agentDefinition',
      stage: 'configuration',
      severity: 'warning',
      title: 'No context variables defined (Level 4 Determinism)',
      description: 'Agent does not have context variables defined. Variables enable state management and personalization across interactions, reducing reliance on LLM memory for tracking user preferences and session data.',
      recommendation: 'Define context variables in your agent to store user preferences, order details, and interaction state. This moves from Level 1-3 (LLM-dependent) to Level 4 (stateful) determinism. Variables make agent behavior more predictable and enable personalized responses based on specific data points.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  } else {
    const vars = botMetadata.contextVariables ?? [];
    findings.push({
      id: 'SCRIPT-002',
      category: 'agentDefinition',
      stage: 'configuration',
      severity: 'info',
      title: `✓ Context variables defined (${vars.length} variables)`,
      description: `Agent uses ${vars.length} context variable(s) for state management. This implements Level 4 Determinism - enabling personalized interactions and context retention without relying solely on LLM memory.`,
      recommendation: 'Continue using variables to track user preferences, session state, and business data. Consider if additional variables would help maintain state for complex multi-step interactions.',
      affectedComponent: `Agent: ${bot.MasterLabel} - Variables: ${vars.map((v) => v.developerName).join(', ')}`,
    });
  }

  // Level 2 Check: Instructions Quality (abstract vs overscripted)
  const topicsWithLongInstructions = topicMetadata.filter(t => {
    const instructions = t.instructions || [];
    return instructions.some(i => i.instruction.length > 500);
  });

  if (topicsWithLongInstructions.length > 0) {
    findings.push({
      id: 'SCRIPT-003',
      category: 'instructionQuality',
      stage: 'configuration',
      severity: 'warning',
      title: 'Topics may be overscripted with excessive instructions',
      description: `${topicsWithLongInstructions.length} topic(s) have very long instructions (>500 chars). Salesforce recommends abstract-level guidance rather than overscripting specific conversational flows. Overscripting reduces agent flexibility and creates brittle behavior.`,
      recommendation: 'Refactor long instructions into abstract-level guidance similar to human employee training. Focus on business policies and intent rather than anticipating every user utterance. For deterministic control of specific flows, consider using Agent Script (Level 6) instead.',
      affectedComponent: `Topics: ${topicsWithLongInstructions.map(t => t.masterLabel || t.fullName).join(', ')}`,
    });
  }

  // Check for instruction-free topics (Level 1)
  const topicsWithoutInstructions = topicMetadata.filter(t => {
    const instructions = t.instructions || [];
    return instructions.length === 0;
  });

  if (topicsWithoutInstructions.length > 0) {
    findings.push({
      id: 'SCRIPT-004',
      category: 'instructionQuality',
      stage: 'configuration',
      severity: 'info',
      title: `${topicsWithoutInstructions.length} topic(s) have no instructions (Level 1 Determinism)`,
      description: `Topics without instructions rely entirely on topic/action descriptions for LLM reasoning (Level 1). This provides maximum flexibility but minimum control. Consider if these topics require policy guidance (Level 2) or remain exploratory.`,
      recommendation: 'For topics requiring compliance or specific behavior patterns, add abstract-level instructions. For exploratory or creative topics, Level 1 may be appropriate. Evaluate based on business requirements.',
      affectedComponent: `Topics: ${topicsWithoutInstructions.map(t => t.masterLabel || t.fullName).join(', ')}`,
    });
  }

  // Level 3 Check: Data Grounding via Actions
  const hasDataRetrievalActions = actionMetadata.some(a => {
    const desc = (a.description || '').toLowerCase();
    return desc.includes('get') || desc.includes('retrieve') || desc.includes('fetch') ||
           desc.includes('search') || desc.includes('query') || desc.includes('find');
  });

  if (!hasDataRetrievalActions) {
    findings.push({
      id: 'SCRIPT-005',
      category: 'actionsConfig',
      stage: 'configuration',
      severity: 'warning',
      title: 'No apparent data grounding actions (Level 3 Determinism)',
      description: 'Agent does not appear to have actions for retrieving external data (no actions with "get", "retrieve", "search", etc. in descriptions). Without data grounding, responses may rely on LLM knowledge rather than verified, current information from your systems.',
      recommendation: 'Implement Level 3 Determinism by adding actions that retrieve data from CRM, knowledge bases, or external systems. This reduces hallucination risk and ensures factually accurate responses grounded in your business data. Connect to Salesforce objects, APIs, or knowledge articles.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  } else {
    findings.push({
      id: 'SCRIPT-006',
      category: 'actionsConfig',
      stage: 'configuration',
      severity: 'info',
      title: '✓ Data grounding actions detected (Level 3 Determinism)',
      description: 'Agent has actions that appear to retrieve external data. This implements Level 3 Determinism - grounding responses in verified information sources rather than relying solely on LLM knowledge.',
      recommendation: 'Ensure these actions are properly configured to fetch current, accurate data. Verify that topic instructions guide the agent to use these actions when factual information is needed.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Level 5 Check: Deterministic Actions (Apex, Flows)
  const hasApexOrFlowActions = actionMetadata.some(a => {
    const fullName = (a.fullName || '').toLowerCase();
    return fullName.includes('apex') || fullName.includes('flow') || fullName.includes('invocable');
  });

  if (hasApexOrFlowActions) {
    findings.push({
      id: 'SCRIPT-007',
      category: 'actionsConfig',
      stage: 'configuration',
      severity: 'info',
      title: '✓ Deterministic actions detected (Level 5 Determinism)',
      description: 'Agent uses Apex classes or Flows for actions. This implements Level 5 Determinism - executing sophisticated business logic through Salesforce integrations with full programmatic control.',
      recommendation: 'Continue leveraging Apex/Flows for complex business processes. Ensure these actions have proper error handling and return structured data the agent can interpret.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Check for potential need of Agent Script (Level 6)
  const hasComplexTopics = topicMetadata.filter(t => {
    const instructions = t.instructions || [];
    const hasMultipleInstructions = instructions.length > 3;
    const hasConditionalKeywords = instructions.some(i => {
      const text = i.instruction.toLowerCase();
      return text.includes('if ') || text.includes('when ') || text.includes('must ') ||
             text.includes('require') || text.includes('only if') || text.includes('before ');
    });
    return hasMultipleInstructions && hasConditionalKeywords;
  });

  if (hasComplexTopics.length > 0) {
    findings.push({
      id: 'SCRIPT-008',
      category: 'instructionQuality',
      stage: 'configuration',
      severity: 'info',
      title: 'Topics with complex conditional logic may benefit from Agent Script',
      description: `${hasComplexTopics.length} topic(s) have complex instructions with conditional logic ("if", "when", "must", etc.). When business rules require guaranteed execution sequences or compliance-critical paths, consider Agent Script (Level 6 Determinism) for hard-coded reasoning paths.`,
      recommendation: 'Evaluate if these topics require immutable decision paths. Agent Script combines natural language flexibility with programmatic certainty - use it for mandatory authentication gates, regulatory compliance, or multi-step dependencies that cannot rely on LLM interpretation alone.',
      affectedComponent: `Topics: ${hasComplexTopics.map(t => t.masterLabel || t.fullName).join(', ')}`,
    });
  }

  // Check topic count (optimal 3-10 for deterministic topic selection)
  if (topicMetadata.length > 10) {
    findings.push({
      id: 'SCRIPT-009',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'warning',
      title: 'Too many topics reduces deterministic topic selection',
      description: `Agent has ${topicMetadata.length} topics. With >10 topics, the LLM must choose from many semantically similar options, reducing determinism in topic routing. Salesforce recommends maximum 10 topics for optimal classification accuracy.`,
      recommendation: 'Consolidate similar topics or use sub-agents for specialized use cases. Fewer, well-differentiated topics improve deterministic topic selection. If complex routing is required, consider Agent Script to hard-code topic transitions.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Check actions per topic (optimal maximum 10 for deterministic action selection)
  topicMetadata.forEach(topic => {
    const topicActions = topic.genAiFunctions || [];
    if (topicActions.length > 10) {
      findings.push({
        id: `SCRIPT-010-${topic.fullName}`,
        category: 'actionsConfig',
        stage: 'configuration',
        severity: 'warning',
        title: `Topic has too many actions (${topicActions.length}) for deterministic selection`,
        description: `Topic "${topic.masterLabel || topic.fullName}" has ${topicActions.length} actions. With >10 actions, the LLM must choose from many options, reducing determinism. Salesforce recommends maximum 10 actions per topic.`,
        recommendation: 'Split this topic into multiple topics or create a sub-agent for complex workflows. Fewer actions per topic improve deterministic action selection. For forced action sequences, consider Agent Script to chain actions programmatically.',
        affectedComponent: `Topic: ${topic.masterLabel || topic.fullName}`,
      });
    }
  });

  // Determinism Level Summary
  const determinismLevel = calculateDeterminismLevel(
    data,
    !!hasContextVariables,
    !!hasDataRetrievalActions,
    !!hasApexOrFlowActions
  );

  findings.push({
    id: 'SCRIPT-011',
    category: 'agentDefinition',
    stage: 'configuration',
    severity: 'info',
    title: `Agent operates at Level ${determinismLevel} Determinism`,
    description: getDeterminismLevelDescription(determinismLevel),
    recommendation: getDeterminismLevelRecommendation(determinismLevel),
    affectedComponent: `Agent: ${bot.MasterLabel}`,
  });

  return findings;
}

function calculateDeterminismLevel(
  data: AgentAnalysisData,
  hasContextVariables: boolean,
  hasDataRetrievalActions: boolean,
  hasApexOrFlowActions: boolean
): number {
  const { topicMetadata } = data;

  // Check if any topics have instructions
  const hasInstructions = topicMetadata.some(t => (t.instructions || []).length > 0);

  // Level 6: Agent Script (would need metadata check - assume not implemented if not detected)
  // Level 5: Apex/Flows
  if (hasApexOrFlowActions) return 5;

  // Level 4: Variables
  if (hasContextVariables) return 4;

  // Level 3: Data Grounding
  if (hasDataRetrievalActions) return 3;

  // Level 2: Instructions
  if (hasInstructions) return 2;

  // Level 1: Instruction-Free
  return 1;
}

function getDeterminismLevelDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: 'Instruction-Free: Agent uses maximum autonomy with LLM determining topic/action selection based solely on descriptions. Best for exploratory or creative tasks.',
    2: 'Agent Instructions: Agent follows policy guidance through topic instructions while maintaining conversational flexibility. Good for compliance-aware interactions.',
    3: 'Data Grounding: Agent connects responses to verified external knowledge sources (CRM, knowledge bases). Reduces hallucination risk with factually accurate responses.',
    4: 'Agent Variables: Agent maintains personalized state across interactions using variables. Enables complex, multi-step user-specific workflows.',
    5: 'Deterministic Actions: Agent executes sophisticated business logic through Apex/Flows/APIs with full programmatic control. Ideal for structured business processes.',
    6: 'Agent Script: Agent uses hard-coded reasoning paths for compliance-critical, high-stakes interactions requiring guaranteed execution sequences.',
  };
  return descriptions[level] || 'Unknown determinism level';
}

function getDeterminismLevelRecommendation(level: number): string {
  const recommendations: Record<number, string> = {
    1: 'Consider adding instructions (Level 2) if business policies need to guide behavior, or variables (Level 4) if state management is needed.',
    2: 'Good foundation with instructions. Consider data grounding (Level 3) for factual accuracy, or variables (Level 4) for stateful interactions.',
    3: 'Solid configuration with data grounding. Consider adding variables (Level 4) for personalization, or Apex/Flows (Level 5) for complex business logic.',
    4: 'Advanced setup with state management. Consider Apex/Flows (Level 5) for sophisticated workflows, or Agent Script (Level 6) for compliance-critical paths.',
    5: 'Excellent - using deterministic actions for business logic. Consider Agent Script (Level 6) only for high-stakes paths requiring immutable execution sequences.',
    6: 'Maximum determinism achieved with Agent Script. Ensure balance between control and flexibility based on business requirements.',
  };
  return recommendations[level] || 'Evaluate appropriate determinism level based on business requirements.';
}
