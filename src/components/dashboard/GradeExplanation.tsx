'use client';

import { AlertCircle, TrendingUp, Target, Award } from 'lucide-react';
import type { AgentReport } from '@/lib/analysis/types';

interface GradeExplanationProps {
  report: AgentReport;
  isOpen: boolean;
  onClose: () => void;
}

export default function GradeExplanation({ report, isOpen, onClose }: GradeExplanationProps) {
  if (!isOpen) return null;

  const gradeInfo = {
    A: {
      label: 'Excellent',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Your agent follows Salesforce best practices comprehensively. Only minor improvements needed.',
      range: '90-100 points',
    },
    B: {
      label: 'Good',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Your agent is well-configured with some areas for improvement. Address warnings to reach excellence.',
      range: '75-89 points',
    },
    C: {
      label: 'Needs Improvement',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      description: 'Your agent has multiple configuration issues. Focus on critical findings first.',
      range: '60-74 points',
    },
    D: {
      label: 'Poor',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Your agent has significant issues that will impact performance. Immediate action required.',
      range: '40-59 points',
    },
    F: {
      label: 'Critical Issues',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Your agent has critical configuration problems. Major refactoring needed before deployment.',
      range: '0-39 points',
    },
  };

  const currentGrade = gradeInfo[report.overallGrade];
  const criticalFindings = report.findings.filter(f => f.severity === 'critical');
  const warningFindings = report.findings.filter(f => f.severity === 'warning');

  // Calculate points lost by severity
  const pointsLostCritical = criticalFindings.length * 25;
  const pointsLostWarning = warningFindings.length * 10;
  const pointsLostInfo = report.findings.filter(f => f.severity === 'info').length * 3;
  const totalPointsLost = pointsLostCritical + pointsLostWarning + pointsLostInfo;

  // Calculate what score would be if critical issues fixed
  const scoreIfCriticalsFixed = Math.min(100, report.overallScore + pointsLostCritical);
  const gradeIfCriticalsFixed = scoreToGrade(scoreIfCriticalsFixed);

  // Find biggest impact findings
  const biggestImpactFindings = criticalFindings.slice(0, 5);

  // Calculate next grade threshold
  const nextGradeThresholds: Record<string, { score: number; grade: string }> = {
    F: { score: 40, grade: 'D' },
    D: { score: 60, grade: 'C' },
    C: { score: 75, grade: 'B' },
    B: { score: 90, grade: 'A' },
    A: { score: 100, grade: 'A+' },
  };

  const nextGrade = nextGradeThresholds[report.overallGrade];
  const pointsNeeded = nextGrade ? nextGrade.score - report.overallScore : 0;
  const findingsToFix = Math.ceil(pointsNeeded / 25); // Approximate: assuming critical fixes

  function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Grade Breakdown & Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Current Grade Card */}
          <div className={`${currentGrade.bgColor} border-2 ${currentGrade.borderColor} rounded-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`text-6xl font-bold ${currentGrade.color}`}>
                  {report.overallGrade}
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${currentGrade.color}`}>
                    {currentGrade.label}
                  </h3>
                  <p className="text-sm text-gray-600">{currentGrade.range}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-gray-900">{report.overallScore}</div>
                <div className="text-sm text-gray-600">out of 100</div>
              </div>
            </div>
            <p className="text-gray-700">{currentGrade.description}</p>
          </div>

          {/* How Your Score Was Calculated */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              How Your Score Was Calculated
            </h3>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Base Score</span>
                  <span className="font-bold text-green-600">100 points</span>
                </div>
                <p className="text-sm text-gray-600">Every agent starts with a perfect score</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-red-600">
                    {criticalFindings.length} Critical Issues
                  </span>
                  <span className="font-bold text-red-600">-{pointsLostCritical} points</span>
                </div>
                <p className="text-sm text-gray-600">Each critical issue: -25 points</p>
                <div className="mt-2 text-xs text-red-600">
                  ⚠️ Critical issues significantly impact agent performance
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-yellow-600">
                    {warningFindings.length} Warnings
                  </span>
                  <span className="font-bold text-yellow-600">-{pointsLostWarning} points</span>
                </div>
                <p className="text-sm text-gray-600">Each warning: -10 points</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-blue-600">
                    {report.findings.filter(f => f.severity === 'info').length} Info Items
                  </span>
                  <span className="font-bold text-blue-600">-{pointsLostInfo} points</span>
                </div>
                <p className="text-sm text-gray-600">Each info item: -3 points</p>
              </div>

              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Final Score</span>
                  <span className={`text-3xl font-bold ${currentGrade.color}`}>
                    {report.overallScore} / 100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stage Breakdown */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Score by Development Stage</h3>
            <div className="space-y-3">
              {Object.entries(report.stageScores).map(([stage, score]) => {
                const stageLabels: Record<string, string> = {
                  designSetup: 'Design & Setup (10%)',
                  configuration: 'Configuration (50%)',
                  test: 'Test (15%)',
                  deploy: 'Deploy (15%)',
                  monitor: 'Monitor (5%)',
                  data: 'Data (Separate)',
                };

                const getScoreColor = (s: number) => {
                  if (s >= 90) return 'bg-green-500';
                  if (s >= 75) return 'bg-blue-500';
                  if (s >= 60) return 'bg-yellow-500';
                  if (s >= 40) return 'bg-orange-500';
                  return 'bg-red-500';
                };

                return (
                  <div key={stage} className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{stageLabels[stage]}</span>
                      <span className="font-bold text-lg">{score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(score)}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Path to Next Grade */}
          {report.overallGrade !== 'A' && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Path to Grade {nextGrade.grade}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Current Score</span>
                  <span className="font-bold text-2xl">{report.overallScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Target Score</span>
                  <span className="font-bold text-2xl text-blue-600">{nextGrade.score}</span>
                </div>
                <div className="border-t border-blue-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Points Needed</span>
                    <span className="font-bold text-xl text-blue-600">+{pointsNeeded}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Fix approximately <strong>{findingsToFix} critical issues</strong> OR{' '}
                    <strong>{Math.ceil(pointsNeeded / 10)} warnings</strong> to reach Grade {nextGrade.grade}
                  </p>
                </div>

                {/* Quick Win: Fix Criticals */}
                {criticalFindings.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-orange-600" />
                      <h4 className="font-bold text-orange-600">Quick Win Opportunity</h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      If you fix all {criticalFindings.length} critical issues, your score would jump to{' '}
                      <strong className="text-green-600">{scoreIfCriticalsFixed}</strong>{' '}
                      (Grade <strong className="text-green-600">{gradeIfCriticalsFixed}</strong>)
                    </p>
                    <div className="text-xs text-gray-600">
                      Potential gain: <strong className="text-green-600">+{pointsLostCritical} points</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Impact Findings */}
          {biggestImpactFindings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Top {biggestImpactFindings.length} Issues (Highest Impact)
              </h3>
              <div className="space-y-3">
                {biggestImpactFindings.map((finding, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{finding.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{finding.affectedComponent}</p>
                      </div>
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        -25 pts
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{finding.description}</p>
                    <div className="bg-blue-50 rounded p-2 text-sm text-blue-800">
                      <strong>Fix:</strong> {finding.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Understanding Your Grade */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Understanding Grade Ranges</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded font-bold flex items-center justify-center">A</span>
                <span className="text-gray-700">90-100: Production-ready agent with best practices</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded font-bold flex items-center justify-center">B</span>
                <span className="text-gray-700">75-89: Good agent, minor improvements recommended</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded font-bold flex items-center justify-center">C</span>
                <span className="text-gray-700">60-74: Needs attention before production deployment</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded font-bold flex items-center justify-center">D</span>
                <span className="text-gray-700">40-59: Significant issues, not ready for production</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-red-100 text-red-600 rounded font-bold flex items-center justify-center">F</span>
                <span className="text-gray-700">0-39: Critical issues, requires major refactoring</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Got It, Thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
