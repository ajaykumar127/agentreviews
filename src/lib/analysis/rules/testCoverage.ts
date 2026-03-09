import type { AgentAnalysisData, Finding } from '../types';

export function analyzeTestCoverage(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { topicMetadata } = data;

  // Check for test utterance/test config references
  // Note: Agentforce Testing Center configs aren't directly in metadata,
  // so we check for indirect indicators
  const allInstructions = topicMetadata
    .flatMap((t) => (t.instructions || []).map((i) => i.instruction))
    .join(' ');

  const testKeywords = /\b(test|utterance|sample|example|scenario)\b/i;

  // Always recommend testing since we can't directly query test configs via metadata API
  if (topicMetadata.length > 0) {
    findings.push({
      id: 'TESTCOV-001',
      category: 'testCoverage',
      stage: 'test',
      severity: 'warning',
      title: 'Verify test coverage in Testing Center',
      description: `Agent has ${topicMetadata.length} topics. Ensure each topic has test utterances configured in the Agentforce Testing Center.`,
      recommendation: 'Create test plans in the Agentforce Testing Center with at least 5 diverse test utterances per topic, covering happy path, edge cases, and boundary conditions.',
      affectedComponent: `Agent: ${data.bot.MasterLabel}`,
    });
  }

  // Check if topics have enough variety for classification testing
  if (topicMetadata.length >= 2) {
    const topicsWithoutClassification = topicMetadata.filter(
      (t) => !t.classificationDescription || t.classificationDescription.trim().length < 10
    );
    if (topicsWithoutClassification.length > 0) {
      findings.push({
        id: 'TESTCOV-002',
        category: 'testCoverage',
        stage: 'test',
        severity: 'info',
        title: 'Classification testing at risk',
        description: `${topicsWithoutClassification.length} topics have weak/missing classification descriptions, making classification testing unreliable.`,
        recommendation: 'Strengthen classification descriptions first, then add diverse test utterances to validate routing accuracy.',
        affectedComponent: `Agent: ${data.bot.MasterLabel}`,
      });
    }
  }

  return findings;
}
