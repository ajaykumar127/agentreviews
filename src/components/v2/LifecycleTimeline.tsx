'use client';

import { CheckCircle2, AlertCircle, Clock, Settings, Sliders, TestTube, Rocket, Activity, Code } from 'lucide-react';
import type { AgentReport, Finding, ReviewStage } from '@/lib/analysis/types';

interface LifecycleTimelineProps {
  agent: AgentReport;
  selectedStage: ReviewStage | null;
  onStageSelect: (stage: ReviewStage) => void;
}

const STAGE_CONFIG: Record<ReviewStage, {
  label: string;
  icon: any;
  color: string;
  description: string;
}> = {
  designSetup: {
    label: 'Design & Setup',
    icon: Settings,
    color: 'blue',
    description: 'Agent definition and planning',
  },
  configuration: {
    label: 'Configuration',
    icon: Sliders,
    color: 'purple',
    description: 'Topics, instructions, and actions',
  },
  test: {
    label: 'Test',
    icon: TestTube,
    color: 'green',
    description: 'Quality assurance and validation',
  },
  deploy: {
    label: 'Deploy',
    icon: Rocket,
    color: 'orange',
    description: 'Activation and channels',
  },
  monitor: {
    label: 'Monitor',
    icon: Activity,
    color: 'pink',
    description: 'Performance and optimization',
  },
  data: {
    label: 'Data Cloud',
    icon: Activity,
    color: 'indigo',
    description: 'Data integration and grounding',
  },
  apex: {
    label: 'Apex',
    icon: Code,
    color: 'amber',
    description: 'Apex best practices and Agentforce actions',
  },
};

export default function LifecycleTimeline({ agent, selectedStage, onStageSelect }: LifecycleTimelineProps) {
  const { stageScores, findings } = agent;

  const getStageStatus = (stage: ReviewStage) => {
    const score = stageScores[stage] ?? 100;
    const stageFindings = findings.filter(f => f.stage === stage);
    const critical = stageFindings.filter(f => f.severity === 'critical').length;
    const warnings = stageFindings.filter(f => f.severity === 'warning').length;

    if (score >= 90 && critical === 0) return { icon: CheckCircle2, status: 'complete', label: 'Complete' };
    if (critical > 0) return { icon: AlertCircle, status: 'critical', label: 'Issues' };
    if (warnings > 0) return { icon: Clock, status: 'warning', label: 'In Progress' };
    return { icon: CheckCircle2, status: 'good', label: 'Good' };
  };

  const stages = Object.keys(STAGE_CONFIG) as ReviewStage[];

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Development Lifecycle</h3>

      {/* Timeline */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 via-green-200 via-orange-200 to-pink-200" />

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stageKey, index) => {
            const config = STAGE_CONFIG[stageKey];
            const Icon = config.icon;
            const score = stageScores[stageKey] ?? 100;
            const status = getStageStatus(stageKey);
            const StatusIcon = status.icon;
            const isSelected = selectedStage === stageKey;

            const stageFindings = findings.filter(f => f.stage === stageKey);
            const critical = stageFindings.filter(f => f.severity === 'critical').length;
            const warnings = stageFindings.filter(f => f.severity === 'warning').length;

            return (
              <button
                key={stageKey}
                onClick={() => onStageSelect(stageKey)}
                className={`relative w-full group ${
                  isSelected ? 'scale-[1.02]' : ''
                } transition-all`}
              >
                <div className={`
                  flex items-start gap-4 p-4 rounded-2xl border-2 transition-all
                  ${isSelected
                    ? `border-${config.color}-400 bg-${config.color}-50 shadow-lg`
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md bg-white'
                  }
                `}>
                  {/* Icon circle */}
                  <div className={`
                    relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                    ${isSelected
                      ? `bg-gradient-to-br from-${config.color}-500 to-${config.color}-600 shadow-lg`
                      : `bg-${config.color}-100`
                    }
                  `}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : `text-${config.color}-600`}`} />

                    {/* Status indicator */}
                    <div className={`
                      absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center
                      ${status.status === 'complete' ? 'bg-emerald-500' :
                        status.status === 'critical' ? 'bg-red-500' :
                        status.status === 'warning' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }
                    `}>
                      <StatusIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={`text-lg font-bold ${isSelected ? `text-${config.color}-900` : 'text-gray-900'}`}>
                        {config.label}
                      </h4>
                      <span className={`
                        text-sm font-semibold px-2 py-0.5 rounded-full
                        ${status.status === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                          status.status === 'critical' ? 'bg-red-100 text-red-700' :
                          status.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }
                      `}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{config.description}</p>

                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Score</span>
                        <span className="text-xs font-bold text-gray-700">{score}/100</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                            score >= 90 ? 'from-emerald-500 to-green-500' :
                            score >= 75 ? 'from-blue-500 to-cyan-500' :
                            score >= 60 ? 'from-yellow-500 to-orange-500' :
                            'from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {/* Issues */}
                    {(critical > 0 || warnings > 0) && (
                      <div className="flex gap-2 flex-wrap">
                        {critical > 0 && (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                            {critical} Critical
                          </span>
                        )}
                        {warnings > 0 && (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            {warnings} Warnings
                          </span>
                        )}
                      </div>
                    )}

                    {critical === 0 && warnings === 0 && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                        ✓ All checks passed
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className={`flex-shrink-0 transition-transform ${isSelected ? 'scale-110' : 'group-hover:translate-x-1'}`}>
                    <svg className={`w-5 h-5 ${isSelected ? `text-${config.color}-600` : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
