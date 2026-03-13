/**
 * Advanced Mathematical Scoring System
 *
 * Implements hybrid approach combining:
 * 1. Exponential decay scoring (natural saturation)
 * 2. Bayesian confidence intervals (uncertainty quantification)
 * 3. Multi-dimensional vector scoring (stakeholder value)
 * 4. Impact weighting (business alignment)
 */

import type { Finding, CategoryScore, AgentAnalysisData } from './types';

// Severity weights for exponential decay (λ parameters)
const SEVERITY_WEIGHTS = {
  critical: 0.15,
  warning: 0.08,
  info: 0.02,
};

// Multi-dimensional mapping
export type ScoreDimension = 'reliability' | 'compliance' | 'usability' | 'maintainability' | 'security';

const DIMENSION_WEIGHTS = {
  reliability: 0.30,
  compliance: 0.25,
  usability: 0.20,
  maintainability: 0.15,
  security: 0.10,
};

// Mapping findings to dimensions
const FINDING_DIMENSION_MAP: Record<string, ScoreDimension[]> = {
  SCRIPT: ['reliability', 'compliance'],
  TOPIC: ['usability', 'reliability'],
  INST: ['usability', 'maintainability'],
  ACT: ['reliability', 'maintainability'],
  SEC: ['security', 'compliance'],
  TEST: ['compliance', 'reliability'],
  ACTIV: ['usability', 'reliability'],
  ERROR: ['reliability', 'maintainability'],
  GUARD: ['security', 'compliance'],
  ESCAL: ['usability', 'compliance'],
  CHANNEL: ['usability'],
  LLM: ['reliability'],
  AGENTDEF: ['maintainability'],
  DATA: ['reliability', 'compliance'],
};

export interface AdvancedCategoryScore extends CategoryScore {
  exponentialScore: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
  dimensions: Record<ScoreDimension, number>;
  impactWeightedScore: number;
}

export interface DimensionalScores {
  dimensions: Record<ScoreDimension, number>;
  composite: number;
}

/**
 * Calculate score using exponential decay model
 * Formula: Score = 100 × e^(-λΣ severity)
 */
export function calculateExponentialScore(findings: Finding[]): number {
  let totalSeverity = 0;

  for (const finding of findings) {
    totalSeverity += SEVERITY_WEIGHTS[finding.severity];
  }

  // Exponential decay
  const score = 100 * Math.exp(-totalSeverity);

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate Bayesian confidence interval
 * Uses Beta distribution for binomial proportion
 */
export function calculateConfidenceInterval(
  findings: Finding[],
  totalPossibleChecks: number
): { lower: number; upper: number; confidence: number } {
  // Prior (informed by historical data)
  const priorAlpha = 80;
  const priorBeta = 20;

  // Count failures (critical + warning)
  const failures = findings.filter(
    f => f.severity === 'critical' || f.severity === 'warning'
  ).length;

  const successes = Math.max(0, totalPossibleChecks - failures);

  // Posterior distribution
  const posteriorAlpha = priorAlpha + successes;
  const posteriorBeta = priorBeta + failures;

  // Expected score (mean of Beta distribution)
  const expectedScore = (posteriorAlpha / (posteriorAlpha + posteriorBeta)) * 100;

  // Approximate 95% credible interval using normal approximation
  // For Beta distribution: mean = α/(α+β), variance = αβ/((α+β)²(α+β+1))
  const n = posteriorAlpha + posteriorBeta;
  const p = posteriorAlpha / n;
  const variance = (posteriorAlpha * posteriorBeta) / (n * n * (n + 1));
  const stdDev = Math.sqrt(variance);

  // 95% CI: mean ± 1.96 * stdDev (scaled to 0-100)
  const lower = Math.max(0, (p - 1.96 * stdDev) * 100);
  const upper = Math.min(100, (p + 1.96 * stdDev) * 100);

  return {
    lower: Math.round(lower * 10) / 10,
    upper: Math.round(upper * 10) / 10,
    confidence: 95,
  };
}

/**
 * Calculate multi-dimensional scores
 */
export function calculateDimensionalScores(findings: Finding[]): DimensionalScores {
  // Initialize dimensions
  const dimensionSeverities: Record<ScoreDimension, number> = {
    reliability: 0,
    compliance: 0,
    usability: 0,
    maintainability: 0,
    security: 0,
  };

  // Accumulate severity per dimension
  for (const finding of findings) {
    const prefix = finding.id.split('-')[0];
    const affectedDimensions = FINDING_DIMENSION_MAP[prefix] || ['reliability'];

    const severityImpact = SEVERITY_WEIGHTS[finding.severity];

    for (const dimension of affectedDimensions) {
      dimensionSeverities[dimension] += severityImpact / affectedDimensions.length;
    }
  }

  // Convert to scores using exponential decay
  const dimensionScores: Record<ScoreDimension, number> = {
    reliability: Math.round(100 * Math.exp(-dimensionSeverities.reliability) * 10) / 10,
    compliance: Math.round(100 * Math.exp(-dimensionSeverities.compliance) * 10) / 10,
    usability: Math.round(100 * Math.exp(-dimensionSeverities.usability) * 10) / 10,
    maintainability: Math.round(100 * Math.exp(-dimensionSeverities.maintainability) * 10) / 10,
    security: Math.round(100 * Math.exp(-dimensionSeverities.security) * 10) / 10,
  };

  // Calculate composite score using weighted harmonic mean
  // Harmonic mean penalizes unbalanced scores
  const composite = calculateWeightedHarmonicMean(dimensionScores, DIMENSION_WEIGHTS);

  return {
    dimensions: dimensionScores,
    composite: Math.round(composite * 10) / 10,
  };
}

/**
 * Calculate weighted harmonic mean
 * Formula: HM = Σw / Σ(w/x)
 */
function calculateWeightedHarmonicMean(
  scores: Record<ScoreDimension, number>,
  weights: Record<ScoreDimension, number>
): number {
  let weightSum = 0;
  let weightedInverseSum = 0;

  for (const dimension in scores) {
    const dim = dimension as ScoreDimension;
    const score = scores[dim];
    const weight = weights[dim];

    if (score > 0) {
      weightSum += weight;
      weightedInverseSum += weight / score;
    }
  }

  if (weightedInverseSum === 0) return 100;

  return weightSum / weightedInverseSum;
}

/**
 * Calculate impact-weighted score
 * Considers usage frequency and business criticality
 */
export function calculateImpactWeightedScore(
  findings: Finding[],
  data: AgentAnalysisData
): number {
  if (findings.length === 0) return 100;

  let totalWeightedImpact = 0;
  let totalWeight = 0;

  for (const finding of findings) {
    const baseSeverity = SEVERITY_WEIGHTS[finding.severity];

    // Calculate impact multiplier based on context
    const impactMultiplier = calculateImpactMultiplier(finding, data);

    totalWeightedImpact += baseSeverity * impactMultiplier;
    totalWeight += impactMultiplier;
  }

  // Average weighted severity
  const avgWeightedSeverity = totalWeightedImpact / Math.max(1, totalWeight);

  // Convert to score using exponential decay
  const score = 100 * Math.exp(-avgWeightedSeverity * findings.length * 0.1);

  return Math.round(score * 10) / 10;
}

/**
 * Calculate impact multiplier for a finding
 */
function calculateImpactMultiplier(finding: Finding, data: AgentAnalysisData): number {
  let multiplier = 1.0;

  // Component type multipliers
  if (finding.affectedComponent.includes('General_FAQ') ||
      finding.affectedComponent.includes('Off_Topic')) {
    multiplier *= 1.5; // High-traffic topics
  }

  // Security/compliance findings are more critical
  if (finding.category === 'security' || finding.category === 'guardrails') {
    multiplier *= 1.8;
  }

  // Test-related findings in production are more critical
  if (finding.category === 'testCoverage' || finding.category === 'testExistence') {
    multiplier *= 1.3;
  }

  // Agent definition issues affect everything
  if (finding.category === 'agentDefinition') {
    multiplier *= 1.6;
  }

  return multiplier;
}

/**
 * Calculate advanced category score with all metrics
 */
export function calculateAdvancedCategoryScore(
  findings: Finding[],
  category: string,
  totalPossibleChecks: number,
  data: AgentAnalysisData
): Partial<AdvancedCategoryScore> {
  // Exponential decay score
  const exponentialScore = calculateExponentialScore(findings);

  // Confidence interval
  const confidenceInterval = calculateConfidenceInterval(findings, totalPossibleChecks);

  // Multi-dimensional breakdown
  const dimensional = calculateDimensionalScores(findings);

  // Impact-weighted score
  const impactWeightedScore = calculateImpactWeightedScore(findings, data);

  return {
    exponentialScore,
    confidenceInterval,
    dimensions: dimensional.dimensions,
    impactWeightedScore,
  };
}

/**
 * Get interpretation for dimensional score
 */
export function getDimensionInterpretation(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Above Average';
  if (score >= 70) return 'Average';
  if (score >= 60) return 'Below Average';
  return 'Needs Improvement';
}

/**
 * Get visual bar for score (0-100)
 */
export function getScoreBar(score: number, width: number = 10): string {
  const filled = Math.round((score / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

/**
 * Calculate percentile rank (simplified - would use real population data)
 */
export function calculatePercentile(score: number, category: string): number {
  // Simplified calculation - in production, use actual population statistics
  // Assuming normal distribution with mean=70, std=15
  const mean = 70;
  const std = 15;

  const zScore = (score - mean) / std;

  // Convert z-score to percentile using cumulative distribution approximation
  const percentile = normCdf(zScore) * 100;

  return Math.round(percentile);
}

/**
 * Cumulative distribution function for standard normal distribution
 * Approximation using error function
 */
function normCdf(z: number): number {
  // Using Abramowitz and Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - probability : probability;
}
