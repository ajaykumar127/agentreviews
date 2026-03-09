import type { CategoryId, CategoryScore, Finding, ReviewStage } from './types';

export const CATEGORY_CONFIG: Record<CategoryId, { label: string; weight: number; stage: ReviewStage }> = {
  // Design & Setup (10% of overall score)
  agentDefinition:    { label: 'Agent Definition',       weight: 0.10, stage: 'designSetup' },

  // Configuration (50% of overall score)
  topicDesign:        { label: 'Topic Design',           weight: 0.10, stage: 'configuration' },
  instructionQuality: { label: 'Instruction Quality',    weight: 0.12, stage: 'configuration' },
  actionsConfig:      { label: 'Actions Configuration',  weight: 0.10, stage: 'configuration' },
  escalation:         { label: 'Escalation Paths',       weight: 0.05, stage: 'configuration' },
  guardrails:         { label: 'Guardrails',             weight: 0.03, stage: 'configuration' },
  channelConfig:      { label: 'Channel Config',         weight: 0.03, stage: 'configuration' },
  errorHandling:      { label: 'Error Handling',         weight: 0.05, stage: 'configuration' },
  security:           { label: 'Security',               weight: 0.02, stage: 'configuration' },

  // Test (15% of overall score)
  testCoverage:       { label: 'Test Coverage',          weight: 0.07, stage: 'test' },
  testExistence:      { label: 'Test Existence',         weight: 0.08, stage: 'test' },

  // Deploy (15% of overall score)
  activation:         { label: 'Activation & Channels',  weight: 0.15, stage: 'deploy' },

  // Monitor (5% of overall score)
  llmGrounding:       { label: 'LLM Grounding',          weight: 0.05, stage: 'monitor' },

  // Data (note: using agentDefinition category for data checks, shown under 'data' stage)
  // This will be displayed separately in the Data tab
};

const SEVERITY_DEDUCTIONS = {
  critical: 25,
  warning: 10,
  info: 3,
};

export function calculateCategoryScore(findings: Finding[]): number {
  let score = 100;
  for (const finding of findings) {
    score -= SEVERITY_DEDUCTIONS[finding.severity];
  }
  return Math.max(0, score);
}

export function calculateOverallScore(categories: CategoryScore[]): number {
  // Calculate total weight of all categories
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);

  // Calculate weighted score
  const weightedScore = categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0);

  // Normalize to 0-100 by dividing by total weight
  // This ensures overall score properly reflects stage scores even if weights don't sum to 1.0
  return Math.round(weightedScore / totalWeight);
}

export function calculateStageScore(
  categories: CategoryScore[],
  stage: ReviewStage
): number {
  const stageCategories = categories.filter(c =>
    CATEGORY_CONFIG[c.category].stage === stage
  );

  if (stageCategories.length === 0) return 100;

  const totalWeight = stageCategories.reduce(
    (sum, cat) => sum + cat.weight,
    0
  );

  const weightedScore = stageCategories.reduce(
    (sum, cat) => sum + (cat.score * cat.weight),
    0
  );

  return Math.round(weightedScore / totalWeight);
}

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
