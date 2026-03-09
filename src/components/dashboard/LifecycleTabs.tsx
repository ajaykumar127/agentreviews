import React from 'react';
import { Settings, Sliders, TestTube, Rocket, Activity, Database } from 'lucide-react';
import type { ReviewStage } from '@/lib/analysis/types';

interface LifecycleTabsProps {
  selectedStage: ReviewStage | 'all';
  onStageSelect: (stage: ReviewStage | 'all') => void;
  stageScores?: {
    designSetup: number;
    configuration: number;
    test: number;
    deploy: number;
    monitor: number;
    data: number;
  };
}

const STAGE_CONFIG: Record<ReviewStage, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}> = {
  designSetup: {
    label: 'Design & Setup',
    icon: Settings,
    color: 'blue',
    description: 'Agent definition and basic configuration',
  },
  configuration: {
    label: 'Configuration',
    icon: Sliders,
    color: 'purple',
    description: 'Topics, instructions, actions, and guardrails',
  },
  test: {
    label: 'Test',
    icon: TestTube,
    color: 'green',
    description: 'Test coverage and quality assurance',
  },
  deploy: {
    label: 'Deploy',
    icon: Rocket,
    color: 'orange',
    description: 'Activation and channel deployment',
  },
  monitor: {
    label: 'Monitor',
    icon: Activity,
    color: 'pink',
    description: 'Runtime performance and grounding',
  },
  data: {
    label: 'Data',
    icon: Database,
    color: 'cyan',
    description: 'Data Cloud configuration and grounding',
  },
};

export default function LifecycleTabs({ selectedStage, onStageSelect, stageScores }: LifecycleTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center gap-1 px-6 overflow-x-auto">
        {/* All Tab */}
        <button
          onClick={() => onStageSelect('all')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
            selectedStage === 'all'
              ? 'border-gray-900 text-gray-900 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <span>All Stages</span>
          {stageScores && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedStage === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {Math.round(
                (stageScores.designSetup + stageScores.configuration + stageScores.test + stageScores.deploy + stageScores.monitor + stageScores.data) / 6
              )}
            </span>
          )}
        </button>

        {/* Lifecycle Stage Tabs */}
        {(Object.keys(STAGE_CONFIG) as ReviewStage[]).map((stage) => {
          const config = STAGE_CONFIG[stage];
          const Icon = config.icon;
          const score = stageScores?.[stage];
          const isSelected = selectedStage === stage;

          return (
            <button
              key={stage}
              onClick={() => onStageSelect(stage)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                isSelected
                  ? `border-${config.color}-600 text-${config.color}-700 font-semibold`
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              title={config.description}
            >
              <Icon className="w-4 h-4" />
              <span>{config.label}</span>
              {score !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isSelected
                    ? `bg-${config.color}-100 text-${config.color}-800`
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {score}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
