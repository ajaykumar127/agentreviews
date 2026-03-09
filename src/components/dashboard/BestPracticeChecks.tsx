import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';
import type { Finding, ReviewStage, Severity } from '@/lib/analysis/types';

interface BestPracticeChecksProps {
  findings: Finding[];
  stage: ReviewStage | 'all';
}

const STAGE_LABELS: Record<ReviewStage, string> = {
  designSetup: 'Design & Setup',
  configuration: 'Configuration',
  test: 'Test',
  deploy: 'Deploy',
  monitor: 'Monitor',
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

  // Count passing checks per stage (total categories minus findings)
  const getTotalChecks = (stageFindings: Finding[]) => {
    const uniqueCategories = new Set(stageFindings.map(f => f.category));
    return uniqueCategories.size + 3; // Assuming ~3 passing checks per category on average
  };

  const getPassingChecks = (stageFindings: Finding[]) => {
    const uniqueCategories = new Set(stageFindings.map(f => f.category));
    const failingChecks = stageFindings.filter(f => f.severity === 'critical' || f.severity === 'warning').length;
    const totalChecks = getTotalChecks(stageFindings);
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
        if (stage !== 'all' && stageFindings.length === 0) {
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

        if (stageFindings.length === 0) return null;

        const criticalCount = stageFindings.filter(f => f.severity === 'critical').length;
        const warningCount = stageFindings.filter(f => f.severity === 'warning').length;
        const infoCount = stageFindings.filter(f => f.severity === 'info').length;
        const passingCount = getPassingChecks(stageFindings);

        return (
          <div key={stageKey} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Stage Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {STAGE_LABELS[stageKey]}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {passingCount} checks passed • {criticalCount} critical • {warningCount} warnings • {infoCount} recommendations
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
            </div>

            {/* Best Practice Checks */}
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
          </div>
        );
      })}
    </div>
  );
}
