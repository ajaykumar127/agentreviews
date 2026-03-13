'use client';

import type { AgentReport, ScoreDimension } from '@/lib/analysis/types';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';

interface AdvancedMetricsProps {
  report: AgentReport;
}

export default function AdvancedMetrics({ report }: AdvancedMetricsProps) {
  const { confidenceInterval, dimensionalScores, percentile } = report;

  if (!confidenceInterval && !dimensionalScores && !percentile) {
    return null; // Don't render if no advanced metrics available
  }

  return (
    <div className="space-y-6">
      {/* Confidence Interval Card */}
      {confidenceInterval && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Score Confidence Interval</h3>
              <p className="text-xs text-gray-500">
                {confidenceInterval.confidence}% confidence range
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Score with confidence range */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estimated Score Range</span>
              <span className="text-lg font-bold text-blue-600">
                {confidenceInterval.lower.toFixed(1)} - {confidenceInterval.upper.toFixed(1)}
              </span>
            </div>

            {/* Visual confidence bar */}
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              {/* Confidence interval range */}
              <div
                className="absolute top-0 h-full bg-blue-200 opacity-40"
                style={{
                  left: `${confidenceInterval.lower}%`,
                  width: `${confidenceInterval.upper - confidenceInterval.lower}%`,
                }}
              />
              {/* Point estimate (overall score) */}
              <div
                className="absolute top-0 h-full w-1 bg-blue-600"
                style={{
                  left: `${report.overallScore}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>0</span>
              <span className="font-medium text-blue-600">
                Point Estimate: {report.overallScore}
              </span>
              <span>100</span>
            </div>

            <p className="text-xs text-gray-600 mt-3">
              <strong>Interpretation:</strong> We are {confidenceInterval.confidence}% confident
              that the true quality score lies between {confidenceInterval.lower.toFixed(1)} and{' '}
              {confidenceInterval.upper.toFixed(1)}.
            </p>
          </div>
        </div>
      )}

      {/* Percentile Rank Card */}
      {percentile !== undefined && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Percentile Rank</h3>
              <p className="text-xs text-gray-500">Population comparison</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your Agent Ranks At</span>
              <span className="text-3xl font-bold text-purple-600">{percentile}th</span>
            </div>

            {/* Percentile bar */}
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${percentile}%` }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-purple-900"
                style={{ left: `${percentile}%` }}
              />
            </div>

            <p className="text-xs text-gray-600 mt-3">
              <strong>Interpretation:</strong> Your agent performs better than {percentile}% of
              agents{percentile > 50 ? ' (above average)' : ' (below average)'}.
            </p>
          </div>
        </div>
      )}

      {/* Dimensional Scores Card */}
      {dimensionalScores && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Multi-Dimensional Quality</h3>
              <p className="text-xs text-gray-500">Breakdown by stakeholder value</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(dimensionalScores).map(([dimension, score]) => (
              <DimensionBar
                key={dimension}
                dimension={dimension as ScoreDimension}
                score={score}
              />
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Dimensions Explained:</strong>
              <br />
              <span className="text-green-700">● Reliability:</span> Predictability and
              determinism
              <br />
              <span className="text-blue-700">● Compliance:</span> Regulatory adherence and testing
              <br />
              <span className="text-yellow-700">● Usability:</span> User experience quality
              <br />
              <span className="text-purple-700">● Maintainability:</span> Code/config quality
              <br />
              <span className="text-red-700">● Security:</span> Data protection and guardrails
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface DimensionBarProps {
  dimension: ScoreDimension;
  score: number;
}

function DimensionBar({ dimension, score }: DimensionBarProps) {
  const dimensionLabels: Record<ScoreDimension, string> = {
    reliability: 'Reliability',
    compliance: 'Compliance',
    usability: 'Usability',
    maintainability: 'Maintainability',
    security: 'Security',
  };

  const dimensionColors: Record<ScoreDimension, string> = {
    reliability: 'green',
    compliance: 'blue',
    usability: 'yellow',
    maintainability: 'purple',
    security: 'red',
  };

  const color = dimensionColors[dimension];
  const interpretation = getDimensionInterpretation(score);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{dimensionLabels[dimension]}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{score.toFixed(1)}</span>
          <span className="text-xs text-gray-500">{interpretation}</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full bg-${color}-500 rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-4 ${i < Math.round(score / 10) ? `bg-${color}-600` : 'bg-gray-200'} ${i === 0 ? 'rounded-l' : ''} ${i === 9 ? 'rounded-r' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDimensionInterpretation(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Above Avg';
  if (score >= 70) return 'Average';
  if (score >= 60) return 'Below Avg';
  return 'Needs Work';
}
