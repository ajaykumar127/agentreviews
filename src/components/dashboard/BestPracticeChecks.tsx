import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { Finding, ReviewStage, Severity } from '@/lib/analysis/types';
import { STAGE_LABELS as STAGE_LABELS_BASE } from '@/lib/analysis/constants';

interface BestPracticeChecksProps {
  findings: Finding[];
  stage: ReviewStage | 'all';
}

const STAGE_LABELS: Record<ReviewStage, string> = {
  ...STAGE_LABELS_BASE,
  data: 'Data Cloud',
};

const SEVERITY_CONFIG: Record<Severity, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
}> = {
  critical: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Must Fix',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Should Fix',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Consider',
  },
};

export default function BestPracticeChecks({ findings, stage }: BestPracticeChecksProps) {
  // Track which stages are expanded (collapsed by default for 'all' view)
  const [expandedStages, setExpandedStages] = useState<Set<ReviewStage>>(new Set());

  // Group findings by stage
  const findingsByStage = findings.reduce((acc, finding) => {
    if (!acc[finding.stage]) {
      acc[finding.stage] = [];
    }
    acc[finding.stage].push(finding);
    return acc;
  }, {} as Record<ReviewStage, Finding[]>);

  // If a specific stage is selected, show only that stage
  const stages = stage === 'all'
    ? (Object.keys(STAGE_LABELS) as ReviewStage[])
    : [stage];

  const toggleStage = (stageKey: ReviewStage) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageKey)) {
      newExpanded.delete(stageKey);
    } else {
      newExpanded.add(stageKey);
    }
    setExpandedStages(newExpanded);
  };

  // When viewing a specific stage (not 'all'), always show it expanded
  const isStageExpanded = (stageKey: ReviewStage) => {
    return stage !== 'all' || expandedStages.has(stageKey);
  };

  // Estimated total checks per stage (based on typical analyzer coverage)
  const STAGE_TOTAL_CHECKS: Record<ReviewStage, number> = {
    designSetup: 18,      // Agent definition, topics, instructions
    configuration: 15,    // Actions, guardrails, channels
    test: 12,             // Test coverage, test existence
    deploy: 10,           // Activation, deployment settings
    monitor: 8,            // Error handling, monitoring setup
    data: 10,              // Data Cloud integration
    apex: 12,              // Apex best-practice rules
  };

  const getTotalChecks = (stageKey: ReviewStage, stageFindings: Finding[]) => {
    // If we have findings, estimate based on categories touched
    if (stageFindings.length > 0) {
      const uniqueCategories = new Set(stageFindings.map(f => f.category));
      return uniqueCategories.size * 3; // ~3 checks per category
    }
    // Otherwise use stage-specific estimate
    return STAGE_TOTAL_CHECKS[stageKey] || 10;
  };

  const getPassingChecks = (stageKey: ReviewStage, stageFindings: Finding[]) => {
    const totalChecks = getTotalChecks(stageKey, stageFindings);
    const failingChecks = stageFindings.filter(f => f.severity === 'critical' || f.severity === 'warning').length;
    return Math.max(0, totalChecks - failingChecks);
  };

  if (findings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          All Best Practices Met!
        </h3>
        <p className="text-green-700">
          Your agent follows all recommended best practices for Agentforce development.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stages.map((stageKey) => {
        const stageFindings = findingsByStage[stageKey] || [];
        const hasFindings = stageFindings.length > 0;

        // If viewing a specific stage (not 'all') and no findings, show full success message
        if (stage !== 'all' && !hasFindings) {
          return (
            <div key={stageKey} className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                {STAGE_LABELS[stageKey]} - All Checks Passed!
              </h3>
              <p className="text-green-700">
                Your agent meets all best practices for this lifecycle stage.
              </p>
            </div>
          );
        }

        const criticalCount = stageFindings.filter(f => f.severity === 'critical').length;
        const warningCount = stageFindings.filter(f => f.severity === 'warning').length;
        const infoCount = stageFindings.filter(f => f.severity === 'info').length;
        const passingCount = getPassingChecks(stageKey, stageFindings);
        const totalChecks = getTotalChecks(stageKey, stageFindings);

        const isExpanded = isStageExpanded(stageKey);
        const showCollapseToggle = stage === 'all'; // Only show toggle in "All Stages" view

        return (
          <div key={stageKey} className={`border-2 rounded-lg overflow-hidden ${hasFindings ? 'border-gray-200' : 'border-green-200 bg-green-50'}`}>
            {/* Stage Header */}
            <button
              onClick={() => showCollapseToggle && toggleStage(stageKey)}
              className={`w-full px-6 py-4 ${isExpanded ? 'border-b border-gray-200' : ''} ${showCollapseToggle ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'} transition-colors ${hasFindings ? 'bg-gray-50' : 'bg-green-50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                  {showCollapseToggle && (
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className={`w-5 h-5 ${hasFindings ? 'text-gray-600' : 'text-green-600'}`} />
                      ) : (
                        <ChevronDown className={`w-5 h-5 ${hasFindings ? 'text-gray-600' : 'text-green-600'}`} />
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className={`text-lg font-semibold ${hasFindings ? 'text-gray-900' : 'text-green-900'}`}>
                      {STAGE_LABELS[stageKey]}
                    </h3>
                    <p className={`text-sm mt-1 ${hasFindings ? 'text-gray-600' : 'text-green-700'}`}>
                      {hasFindings ? (
                        `${passingCount} checks passed • ${criticalCount} critical • ${warningCount} warnings • ${infoCount} recommendations`
                      ) : (
                        `${totalChecks} checks passed • 0 issues found ✓`
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!hasFindings && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                  {criticalCount > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      {criticalCount} Must Fix
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                      {warningCount} Should Fix
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Best Practice Checks */}
            {isExpanded && (
              <>
                {hasFindings ? (
                  <div className="divide-y divide-gray-100">
              {stageFindings.map((finding, idx) => {
                const severityConfig = SEVERITY_CONFIG[finding.severity];
                const Icon = severityConfig.icon;

                return (
                  <div key={idx} className={`p-6 ${severityConfig.bgColor} hover:shadow-sm transition-shadow`}>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Icon className={`w-6 h-6 ${severityConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h4 className="text-base font-semibold text-gray-900">
                            {finding.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${severityConfig.color} border border-current shrink-0`}>
                            {severityConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          {finding.description}
                        </p>
                        <div className="bg-white border border-gray-200 rounded-md p-3">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                            Recommendation
                          </p>
                          <p className="text-sm text-gray-900">
                            {finding.recommendation}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Component:</span> {finding.affectedComponent}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Check ID:</span> {finding.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-green-50">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h4 className="text-base font-semibold text-green-900 mb-2">
                      All {totalChecks} Checks Passed!
                    </h4>
                    <p className="text-sm text-green-700">
                      Your agent meets all best practices for this lifecycle stage. No issues found.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
