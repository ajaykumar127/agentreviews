import type { AgentAnalysisData, Finding } from '../types';

export function analyzeTestExistence(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { bot, testDefinitions } = data;

  // Check if any test definitions exist
  if (testDefinitions.length === 0) {
    findings.push({
      id: 'TEST-001',
      category: 'testExistence',
      stage: 'test',
      severity: 'critical',
      title: 'No test definitions exist for agent',
      description: `Agent "${bot.MasterLabel}" has no test definitions (AiEvaluationDefinition). Testing is essential for validating agent behavior before and after deployment.`,
      recommendation: 'Create test definitions using the Testing Center or Agentforce DX CLI. Start with happy path tests for your major topics, then add edge cases and error scenarios.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
    return findings;
  }

  // Check subjectName matching
  for (const testDef of testDefinitions) {
    if (testDef.SubjectName !== bot.DeveloperName) {
      findings.push({
        id: 'TEST-002',
        category: 'testExistence',
        stage: 'test',
        severity: 'warning',
        title: 'Test subjectName doesn\'t match agent',
        description: `Test "${testDef.MasterLabel}" has SubjectName "${testDef.SubjectName}" which doesn't match agent developer name "${bot.DeveloperName}". This test may not be targeting the correct agent.`,
        recommendation: 'Verify the test is configured for the correct agent and update the SubjectName if needed.',
        affectedComponent: `Test: ${testDef.MasterLabel}`,
      });
    }

    // Check if test is inactive
    if (!testDef.IsActive) {
      findings.push({
        id: 'TEST-003',
        category: 'testExistence',
        stage: 'test',
        severity: 'warning',
        title: 'Test definition is inactive',
        description: `Test "${testDef.MasterLabel}" exists but is marked as inactive. Inactive tests won't run automatically or in CI/CD pipelines.`,
        recommendation: 'Activate the test definition if it should be part of your testing strategy, or remove it if no longer needed.',
        affectedComponent: `Test: ${testDef.MasterLabel}`,
      });
    }
  }

  // Check test coverage - recommend more tests
  if (testDefinitions.length === 1) {
    findings.push({
      id: 'TEST-004',
      category: 'testExistence',
      stage: 'test',
      severity: 'info',
      title: 'Limited test coverage',
      description: `Agent "${bot.MasterLabel}" has only one test definition. Comprehensive testing should cover multiple scenarios: happy paths, edge cases, error handling, and off-topic queries.`,
      recommendation: 'Add more test cases to cover: (1) each major topic, (2) edge cases and invalid inputs, (3) error scenarios, (4) off-topic/prompt injection attempts.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Success case - good test coverage
  if (testDefinitions.length >= 3 && testDefinitions.some(t => t.IsActive)) {
    findings.push({
      id: 'TEST-005',
      category: 'testExistence',
      stage: 'test',
      severity: 'info',
      title: 'Good test coverage detected',
      description: `Agent "${bot.MasterLabel}" has ${testDefinitions.length} test definitions with at least one active test. This indicates a mature testing strategy.`,
      recommendation: 'Continue running tests regularly and expand coverage as new topics and actions are added.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  return findings;
}
