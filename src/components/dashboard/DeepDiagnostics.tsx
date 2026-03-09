'use client';

import { TrendingDown, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';
import type { AgentReport, CategoryScore } from '@/lib/analysis/types';

interface DeepDiagnosticsProps {
  report: AgentReport;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeepDiagnostics({ report, isOpen, onClose }: DeepDiagnosticsProps) {
  if (!isOpen) return null;

  // Calculate diagnostic metrics
  const criticalByCategory = report.categories.map(cat => ({
    category: cat.label,
    criticals: cat.findings.filter(f => f.severity === 'critical').length,
    warnings: cat.findings.filter(f => f.severity === 'warning').length,
    score: cat.score,
    weight: cat.weight,
    impact: (100 - cat.score) * cat.weight, // Points lost weighted by category importance
  })).sort((a, b) => b.impact - a.impact);

  // Find root causes (categories with multiple critical issues)
  const rootCauses = criticalByCategory.filter(c => c.criticals >= 2);

  // Quick wins (high weight categories with just a few issues)
  const quickWins = criticalByCategory.filter(c =>
    c.weight >= 0.10 && c.criticals <= 2 && c.criticals > 0
  );

  // Calculate health metrics
  const totalChecks = report.categories.reduce((sum, cat) =>
    sum + cat.findings.length, 0
  );
  const passedChecks = report.categories.reduce((sum, cat) =>
    sum + cat.findings.filter(f => f.severity === 'info').length, 0
  );
  const healthPercentage = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  // Find cascading issues (same finding ID across multiple components)
  const findingIdCount: Record<string, number> = {};
  report.findings.forEach(f => {
    const baseId = f.id.split('-')[0]; // e.g., "TOPIC" from "TOPIC-001"
    findingIdCount[baseId] = (findingIdCount[baseId] || 0) + 1;
  });
  const cascadingIssues = Object.entries(findingIdCount)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  // Category performance analysis
  const categoryPerformance = {
    excellent: report.categories.filter(c => c.score >= 90).length,
    good: report.categories.filter(c => c.score >= 75 && c.score < 90).length,
    needsWork: report.categories.filter(c => c.score >= 60 && c.score < 75).length,
    poor: report.categories.filter(c => c.score < 60).length,
  };

  // Severity distribution
  const severityBreakdown = {
    critical: report.findings.filter(f => f.severity === 'critical').length,
    warning: report.findings.filter(f => f.severity === 'warning').length,
    info: report.findings.filter(f => f.severity === 'info').length,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Deep Diagnostic Analysis</h2>
            <p className="text-sm text-gray-600">Advanced insights and root cause analysis</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Health Dashboard */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{healthPercentage}%</div>
              <div className="text-sm text-gray-700 mt-1">Health Score</div>
              <div className="text-xs text-gray-600 mt-1">{passedChecks}/{totalChecks} checks passed</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-600">{severityBreakdown.critical}</div>
              <div className="text-sm text-gray-700 mt-1">Critical Issues</div>
              <div className="text-xs text-gray-600 mt-1">-{severityBreakdown.critical * 25} points</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-600">{severityBreakdown.warning}</div>
              <div className="text-sm text-gray-700 mt-1">Warnings</div>
              <div className="text-xs text-gray-600 mt-1">-{severityBreakdown.warning * 10} points</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{categoryPerformance.excellent}</div>
              <div className="text-sm text-gray-700 mt-1">Excellent Categories</div>
              <div className="text-xs text-gray-600 mt-1">Score ≥ 90</div>
            </div>
          </div>

          {/* Root Cause Analysis */}
          {rootCauses.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Root Cause Analysis
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                These categories have multiple critical issues, indicating systemic problems that need immediate attention.
              </p>
              <div className="space-y-3">
                {rootCauses.map((cause, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{cause.category}</h4>
                        <p className="text-sm text-gray-600">Weight: {(cause.weight * 100).toFixed(0)}% of overall score</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">{cause.criticals}</div>
                        <div className="text-xs text-gray-600">critical issues</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-red-600">Score: {cause.score}/100</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-red-600">Impact: -{cause.impact.toFixed(1)} points</span>
                    </div>
                    <div className="mt-3 bg-red-100 rounded p-2 text-sm text-red-800">
                      <strong>⚠️ Action Required:</strong> This category has systemic issues. Review all {cause.criticals} critical findings and create a comprehensive fix plan.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {quickWins.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Win Opportunities
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                These high-value categories have just a few issues. Fix them for maximum score improvement with minimal effort!
              </p>
              <div className="space-y-3">
                {quickWins.map((win, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{win.category}</h4>
                        <p className="text-sm text-gray-600">High impact category ({(win.weight * 100).toFixed(0)}% weight)</p>
                      </div>
                      <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        +{win.criticals * 25} pts potential
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Only {win.criticals} critical issue{win.criticals > 1 ? 's' : ''} to fix</span>
                      {win.warnings > 0 && <><span>•</span><span>{win.warnings} warnings</span></>}
                    </div>
                    <div className="mt-3 bg-green-100 rounded p-2 text-sm text-green-800">
                      <strong>💡 Quick Win:</strong> Fix {win.criticals} issue{win.criticals > 1 ? 's' : ''} to gain {win.criticals * 25} points with high ROI
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Analysis by Category */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Impact Analysis (Biggest Score Drags)
            </h3>
            <div className="space-y-2">
              {criticalByCategory.slice(0, 8).map((cat, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{cat.category}</h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Critical: {cat.criticals}</span>
                        <span>Warnings: {cat.warnings}</span>
                        <span>Score: {cat.score}/100</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">-{cat.impact.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">points lost</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        cat.score >= 90 ? 'bg-green-500' :
                        cat.score >= 75 ? 'bg-blue-500' :
                        cat.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${cat.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cascading Issues */}
          {cascadingIssues.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Cascading Issues (Patterns Detected)
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                These issues appear multiple times across different components, suggesting systematic problems.
              </p>
              <div className="space-y-3">
                {cascadingIssues.map(([id, count], idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{id}-* Issues</h4>
                        <p className="text-sm text-gray-600">
                          Appears in {count} different places
                        </p>
                      </div>
                      <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {count}x
                      </div>
                    </div>
                    <div className="mt-2 bg-orange-100 rounded p-2 text-sm text-orange-800">
                      <strong>Pattern:</strong> This issue repeats across multiple components. Consider a template or standard fix approach.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Performance Distribution */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Category Performance Distribution</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Excellent (≥90)</span>
                  <span className="text-2xl font-bold text-green-600">{categoryPerformance.excellent}</span>
                </div>
                <p className="text-xs text-gray-600">Categories performing at best practice level</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Good (75-89)</span>
                  <span className="text-2xl font-bold text-blue-600">{categoryPerformance.good}</span>
                </div>
                <p className="text-xs text-gray-600">Minor improvements needed</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Needs Work (60-74)</span>
                  <span className="text-2xl font-bold text-yellow-600">{categoryPerformance.needsWork}</span>
                </div>
                <p className="text-xs text-gray-600">Moderate issues requiring attention</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Poor (&lt;60)</span>
                  <span className="text-2xl font-bold text-red-600">{categoryPerformance.poor}</span>
                </div>
                <p className="text-xs text-gray-600">Significant issues needing immediate action</p>
              </div>
            </div>
          </div>

          {/* Recommendations Priority Matrix */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Action Priority</h3>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                <div className="flex items-center gap-3">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">P0</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">Critical - Immediate Action</h4>
                    <p className="text-sm text-gray-600">Fix all {severityBreakdown.critical} critical issues before deployment</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                <div className="flex items-center gap-3">
                  <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">P1</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">High Priority - This Sprint</h4>
                    <p className="text-sm text-gray-600">Address root cause categories with multiple issues</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex items-center gap-3">
                  <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">P2</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">Medium Priority - Next Sprint</h4>
                    <p className="text-sm text-gray-600">Resolve remaining {severityBreakdown.warning} warnings</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">P3</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">Nice to Have - Backlog</h4>
                    <p className="text-sm text-gray-600">Polish and optimize info-level items</p>
                  </div>
                </div>
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
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
