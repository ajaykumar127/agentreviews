import type { AgentAnalysisData, Finding } from '../types';
import { calculateKeywordOverlap } from '../../utils/textAnalysis';

export function analyzeTopicDesign(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { topicMetadata, topics } = data;

  if (topics.length === 0) {
    findings.push({
      id: 'TOPIC-000',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'critical',
      title: 'No topics found',
      description: 'No Agentforce topics (GenAiPlugin) were found in this org.',
      recommendation: 'Create at least one topic to define what your agent can do.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
    return findings;
  }

  // SALESFORCE BEST PRACTICE: Check for required topics
  const topicNames = topicMetadata.map(t => (t.masterLabel || t.fullName || '').toLowerCase());

  // Check for General_FAQ topic (handles general questions)
  const hasGeneralFAQ = topicNames.some(name =>
    name.includes('general') && (name.includes('faq') || name.includes('question')) ||
    name === 'generalfaq' ||
    name === 'general_faq'
  );
  if (!hasGeneralFAQ) {
    findings.push({
      id: 'TOPIC-008',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'critical',
      title: 'Missing General_FAQ topic',
      description: 'Agent does not have a General_FAQ topic. This is a Salesforce best practice to handle general questions that don\'t fit other specific topics.',
      recommendation: 'Create a "General_FAQ" topic to handle general inquiries, greetings, and questions that don\'t match specific topics. This improves user experience when questions fall outside main use cases.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for Off_Topic topic (handles out-of-scope requests)
  const hasOffTopic = topicNames.some(name =>
    name.includes('off') && name.includes('topic') ||
    name === 'offtopic' ||
    name === 'off_topic' ||
    name.includes('outofscope') ||
    name.includes('out_of_scope')
  );
  if (!hasOffTopic) {
    findings.push({
      id: 'TOPIC-009',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'critical',
      title: 'Missing Off_Topic topic',
      description: 'Agent does not have an Off_Topic topic. This is a Salesforce best practice to gracefully handle requests outside the agent\'s scope.',
      recommendation: 'Create an "Off_Topic" topic to detect and respond to out-of-scope requests. Configure it to provide a polite message explaining what the agent can help with, and offer to escalate if needed.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for Escalation topic (human handoff)
  const hasEscalation = topicNames.some(name =>
    name.includes('escalat') ||
    name.includes('handoff') ||
    name.includes('human') ||
    name.includes('agent') && name.includes('live')
  );
  if (!hasEscalation) {
    findings.push({
      id: 'TOPIC-010',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'warning',
      title: 'No dedicated escalation topic',
      description: 'Agent does not have a dedicated escalation/handoff topic. While escalation can be handled within other topics, a dedicated topic is recommended for clear escalation paths.',
      recommendation: 'Consider creating an "Escalation" or "Human_Handoff" topic that explicitly handles requests to speak with a human agent.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // SALESFORCE GUIDELINE: Check topic count (optimal is 3-10)
  if (topics.length > 10) {
    findings.push({
      id: 'TOPIC-011',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'warning',
      title: 'Too many topics (>10)',
      description: `Agent has ${topics.length} topics. Salesforce recommends keeping topics between 3-10 for optimal classification accuracy. Too many topics increases routing confusion and latency.`,
      recommendation: 'Consolidate similar topics or move specialized topics to sub-agents. Focus on clear, distinct use cases. Consider if some topics can be merged or if a multi-agent architecture is more appropriate.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Track topics with common issues for consolidation
  const topicsMissingClassification: string[] = [];
  const topicsWithShortClassification: string[] = [];
  const topicsMissingScope: string[] = [];
  const topicsWithGenericNames: string[] = [];

  for (const topic of topicMetadata) {
    const name = topic.masterLabel || topic.fullName;

    // Collect topics missing classification
    if (!topic.classificationDescription || topic.classificationDescription.trim().length === 0) {
      topicsMissingClassification.push(name);
    } else if (topic.classificationDescription.trim().length < 20) {
      topicsWithShortClassification.push(name);
    }

    // Collect topics missing scope
    if (!topic.scope || topic.scope.trim().length === 0) {
      topicsMissingScope.push(name);
    }

    // Collect topics with generic names
    const genericNames = /^(general|default|misc|other|main|test|new|topic\d*)$/i;
    if (genericNames.test(topic.fullName) || genericNames.test(name)) {
      topicsWithGenericNames.push(name);
    }
  }

  // Add consolidated findings
  if (topicsMissingClassification.length > 0) {
    findings.push({
      id: 'TOPIC-001',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'critical',
      title: `${topicsMissingClassification.length} topic(s) missing classification description`,
      description: `The following topics have no classification description: ${topicsMissingClassification.map(t => `"${t}"`).join(', ')}. The agent won't know when to route conversations to these topics.`,
      recommendation: 'Add classification descriptions that explain when the agent should use each topic (e.g., "Use this topic when the customer asks about order status or tracking").',
      affectedComponent: `Topics: ${topicsMissingClassification.join(', ')}`,
    });
  }

  if (topicsWithShortClassification.length > 0) {
    findings.push({
      id: 'TOPIC-003',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'warning',
      title: `${topicsWithShortClassification.length} topic(s) have brief classification descriptions`,
      description: `The following topics have classification descriptions under 20 characters: ${topicsWithShortClassification.map(t => `"${t}"`).join(', ')}. This may not provide enough context for proper routing.`,
      recommendation: 'Expand classification descriptions with specific trigger phrases, intent signals, and example scenarios.',
      affectedComponent: `Topics: ${topicsWithShortClassification.join(', ')}`,
    });
  }

  if (topicsMissingScope.length > 0) {
    findings.push({
      id: 'TOPIC-002',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'critical',
      title: `${topicsMissingScope.length} topic(s) missing scope definition`,
      description: `The following topics have no scope defined: ${topicsMissingScope.map(t => `"${t}"`).join(', ')}. Without scope, the agent has no boundaries on what it can do within these topics.`,
      recommendation: 'Define scope for each topic to constrain the agent\'s actions (e.g., "Can view order status but cannot modify orders or process refunds").',
      affectedComponent: `Topics: ${topicsMissingScope.join(', ')}`,
    });
  }

  if (topicsWithGenericNames.length > 0) {
    findings.push({
      id: 'TOPIC-005',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'warning',
      title: `${topicsWithGenericNames.length} topic(s) have generic names`,
      description: `The following topics use generic names that don't convey their purpose: ${topicsWithGenericNames.map(t => `"${t}"`).join(', ')}.`,
      recommendation: 'Use specific, purpose-driven topic names (e.g., "Order_Status_Inquiry", "Return_Processing").',
      affectedComponent: `Topics: ${topicsWithGenericNames.join(', ')}`,
    });
  }

  if (topics.length === 1) {
    findings.push({
      id: 'TOPIC-004',
      category: 'topicDesign',
      stage: 'configuration',
      severity: 'warning',
      title: 'Only one topic defined',
      description: 'The agent has only one topic. With a single topic, there is no meaningful intent routing.',
      recommendation: 'Consider adding more topics to separate different types of customer inquiries for better routing and maintainability.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check for overlapping classification descriptions
  for (let i = 0; i < topicMetadata.length; i++) {
    for (let j = i + 1; j < topicMetadata.length; j++) {
      const a = topicMetadata[i];
      const b = topicMetadata[j];
      if (a.classificationDescription && b.classificationDescription) {
        const overlap = calculateKeywordOverlap(
          a.classificationDescription,
          b.classificationDescription
        );
        if (overlap > 0.5) {
          findings.push({
            id: 'TOPIC-007',
            category: 'topicDesign',
            stage: 'configuration',
            severity: 'warning',
            title: 'Overlapping topic classifications',
            description: `Topics "${a.masterLabel}" and "${b.masterLabel}" have highly similar classification descriptions (${Math.round(overlap * 100)}% keyword overlap). This may cause routing ambiguity.`,
            recommendation: 'Differentiate the classification descriptions to make intent routing more precise.',
            affectedComponent: `Topics: ${a.masterLabel}, ${b.masterLabel}`,
          });
        }
      }
    }
  }

  return findings;
}
