'use client';

import { useState } from 'react';
import type { AgentReport, ScoreDimension } from '@/lib/analysis/types';
import { scoreColor } from '@/lib/analysis/scoring';
import { ChevronDown, ChevronUp, Info, TrendingUp, Target, BarChart3, HelpCircle } from 'lucide-react';

interface CollapsibleScoreCardProps {
  report: AgentReport;
}

export default function CollapsibleScoreCard({ report }: CollapsibleScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { overallScore, overallGrade, confidenceInterval, dimensionalScores, percentile, findings } = report;

  const color = scoreColor(overallScore);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (overallScore / 100) * circumference;

  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;
  const infoCount = findings.filter((f) => f.severity === 'info').length;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Main Score Card - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex flex-col items-center hover:bg-gray-50 transition group"
      >
        <div className="flex items-center justify-between w-full mb-4">
          <h3 className="text-sm font-medium text-gray-500">Overall Score</h3>
          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium group-hover:text-blue-700 transition">
            <span>Advanced Metrics</span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>

        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color }}>
              {overallScore}
            </span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
        </div>
        <div
          className="mt-3 text-lg font-bold px-3 py-1 rounded-full"
          style={{ color, backgroundColor: `${color}15` }}
        >
          Grade: {overallGrade}
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 mt-4 text-xs">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600">{criticalCount} Critical</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">{warningCount} Warnings</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-gray-600">{infoCount} Passed</span>
          </div>
        </div>
      </button>

      {/* Expanded Metrics */}
      {isExpanded && (
        <div className="border-t-2 border-gray-200 p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Confidence Interval Card */}
            {confidenceInterval && (
              <MetricCard
                icon={<Target className="w-5 h-5 text-blue-600" />}
                title="Confidence Interval"
                value={`${confidenceInterval.lower.toFixed(1)} - ${confidenceInterval.upper.toFixed(1)}`}
                subtitle={`${confidenceInterval.confidence}% confidence`}
                interpretation="Shows the range where your true quality score likely falls, accounting for measurement uncertainty."
                tooltip={{
                  formula: "CI = Beta(α + successes, β + failures)",
                  explanation: "Uses Bayesian statistics with Beta distribution. The interval shows where your true score likely falls. Prior: α=80, β=20 based on historical data.",
                }}
              >
                <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 h-full bg-blue-200 opacity-40"
                    style={{
                      left: `${confidenceInterval.lower}%`,
                      width: `${confidenceInterval.upper - confidenceInterval.lower}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 h-full w-1 bg-blue-600"
                    style={{ left: `${overallScore}%` }}
                  />
                </div>
              </MetricCard>
            )}

            {/* Percentile Rank Card */}
            {percentile !== undefined && (
              <MetricCard
                icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                title="Percentile Rank"
                value={`${percentile}th`}
                subtitle={percentile > 50 ? 'Above Average' : 'Below Average'}
                interpretation={`Your agent performs better than ${percentile}% of agents in the population.`}
                tooltip={{
                  formula: "Percentile = Φ((score - μ) / σ) × 100",
                  explanation: "Z-score normalization using population mean μ=70, std dev σ=15. Shows how you rank compared to other agents.",
                }}
              >
                <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${percentile}%` }}
                  />
                </div>
              </MetricCard>
            )}
          </div>

          {/* Multi-Dimensional Scores */}
          {dimensionalScores && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Quality Dimensions</h4>
                </div>
                <Tooltip
                  formula="HM = Σw / Σ(w/x)"
                  explanation="Weighted harmonic mean penalizes imbalance. Weights: Reliability 30%, Compliance 25%, Usability 20%, Maintainability 15%, Security 10%"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </Tooltip>
              </div>

              <div className="mb-4 text-xs text-gray-600 italic">
                Breaks down quality into five key dimensions valued by different stakeholders.
              </div>

              <div className="space-y-3">
                {Object.entries(dimensionalScores).map(([dimension, score]) => (
                  <DimensionBar
                    key={dimension}
                    dimension={dimension as ScoreDimension}
                    score={score}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scoring Method Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700">
                <strong>Scoring Method:</strong> Exponential decay (Score = 100 × e^(-λΣ)) where λ_critical=0.15, λ_warning=0.08, λ_info=0.02.
                This creates natural saturation and prevents impossible scores.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  interpretation: string;
  tooltip: {
    formula: string;
    explanation: string;
  };
  children?: React.ReactNode;
}

function MetricCard({ icon, title, value, subtitle, interpretation, tooltip, children }: MetricCardProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        </div>
        <Tooltip formula={tooltip.formula} explanation={tooltip.explanation}>
          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
        </Tooltip>
      </div>

      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>

      <div className="mb-3 text-xs text-gray-600 italic">
        {interpretation}
      </div>

      {children}
    </div>
  );
}

interface TooltipProps {
  formula: string;
  explanation: string;
  children: React.ReactNode;
}

function Tooltip({ formula, explanation, children }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="invisible group-hover:visible absolute z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl top-0 right-6 -translate-y-2">
        <div className="font-mono text-green-400 mb-2 break-all">{formula}</div>
        <div className="text-gray-200">{explanation}</div>
        <div className="absolute top-3 -right-1 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
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
    reliability: 'bg-green-500',
    compliance: 'bg-blue-500',
    usability: 'bg-yellow-500',
    maintainability: 'bg-purple-500',
    security: 'bg-red-500',
  };

  const dimensionFormulas: Record<ScoreDimension, string> = {
    reliability: '100 × e^(-Σ(SCRIPT + TOPIC + ACT + ERROR + LLM))',
    compliance: '100 × e^(-Σ(SCRIPT + SEC + TEST + GUARD + DATA))',
    usability: '100 × e^(-Σ(TOPIC + INST + ESCAL + CHANNEL))',
    maintainability: '100 × e^(-Σ(INST + ACT + ERROR + AGENTDEF))',
    security: '100 × e^(-Σ(SEC + GUARD))',
  };

  const dimensionInterpretations: Record<ScoreDimension, string> = {
    reliability: 'Measures predictability, determinism, and consistent behavior',
    compliance: 'Tracks regulatory adherence, testing, and data governance',
    usability: 'Evaluates user experience, conversation design, and accessibility',
    maintainability: 'Assesses code quality, documentation, and ease of updates',
    security: 'Monitors data protection, guardrails, and vulnerability safeguards',
  };

  const color = dimensionColors[dimension];

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{dimensionLabels[dimension]}</span>
            <Tooltip
              formula={dimensionFormulas[dimension]}
              explanation={`${dimensionLabels[dimension]} dimension aggregates findings from specific categories using exponential decay.`}
            >
              <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
            </Tooltip>
          </div>
          <span className="text-sm font-bold text-gray-900">{score.toFixed(1)}</span>
        </div>
        <div className="text-[10px] text-gray-500 mb-1 italic">
          {dimensionInterpretations[dimension]}
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${color} rounded-full transition-all`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
