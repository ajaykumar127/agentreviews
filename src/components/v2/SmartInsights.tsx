'use client';

import { XCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Finding, ReviewStage } from '@/lib/analysis/types';

interface SmartInsightsProps {
  findings: Finding[];
  selectedStage: ReviewStage | null;
}

export default function SmartInsights({ findings, selectedStage }: SmartInsightsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter findings by stage
  const displayFindings = selectedStage
    ? findings.filter(f => f.stage === selectedStage)
    : findings;

  // Group by severity
  const criticalFindings = displayFindings.filter(f => f.severity === 'critical');
  const warningFindings = displayFindings.filter(f => f.severity === 'warning');
  const infoFindings = displayFindings.filter(f => f.severity === 'info');

  const getSeverityConfig = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return {
          icon: XCircle,
          label: 'Must Fix',
          color: 'red',
          bgGradient: 'from-red-50 to-pink-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          badgeColor: 'bg-red-100 text-red-700',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          label: 'Should Fix',
          color: 'amber',
          bgGradient: 'from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-900',
          badgeColor: 'bg-amber-100 text-amber-700',
        };
      case 'info':
        return {
          icon: Info,
          label: 'Consider',
          color: 'blue',
          bgGradient: 'from-blue-50 to-cyan-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          badgeColor: 'bg-blue-100 text-blue-700',
        };
    }
  };

  const renderFindingCard = (finding: Finding) => {
    const config = getSeverityConfig(finding.severity);
    const Icon = config.icon;
    const isExpanded = expandedId === finding.id;

    return (
      <div
        key={`${finding.id}-${finding.affectedComponent}`}
        className={`
          bg-gradient-to-br ${config.bgGradient} rounded-2xl border ${config.borderColor}
          overflow-hidden transition-all hover:shadow-lg
        `}
      >
        <button
          onClick={() => setExpandedId(isExpanded ? null : finding.id)}
          className="w-full p-5 text-left"
        >
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${config.color}-600`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className={`text-base font-bold ${config.textColor}`}>
                  {finding.title}
                </h4>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </div>

              <p className="text-sm text-gray-700 mb-3">
                {finding.description}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.badgeColor}`}>
                  {config.label}
                </span>
                <span className="text-xs text-gray-500">
                  {finding.affectedComponent}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    How to Fix
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {finding.recommendation}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-mono">
                  Check ID: {finding.id}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (displayFindings.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl border-2 border-emerald-200 p-12 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-emerald-900 mb-2">
          Perfect! All Checks Passed
        </h3>
        <p className="text-emerald-700">
          {selectedStage
            ? 'This stage meets all best practice guidelines.'
            : 'Your agent follows all recommended best practices.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {selectedStage ? 'Stage Insights' : 'All Insights'}
        </h3>
        <div className="flex gap-4">
          {criticalFindings.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-gray-700">
                {criticalFindings.length} Critical
              </span>
            </div>
          )}
          {warningFindings.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold text-gray-700">
                {warningFindings.length} Warnings
              </span>
            </div>
          )}
          {infoFindings.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-gray-700">
                {infoFindings.length} Recommendations
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Critical Issues */}
      {criticalFindings.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Must Fix ({criticalFindings.length})
          </h4>
          <div className="space-y-3">
            {criticalFindings.map(renderFindingCard)}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warningFindings.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Should Fix ({warningFindings.length})
          </h4>
          <div className="space-y-3">
            {warningFindings.map(renderFindingCard)}
          </div>
        </div>
      )}

      {/* Info */}
      {infoFindings.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Consider ({infoFindings.length})
          </h4>
          <div className="space-y-3">
            {infoFindings.map(renderFindingCard)}
          </div>
        </div>
      )}
    </div>
  );
}
