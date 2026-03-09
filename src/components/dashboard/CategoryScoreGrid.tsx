'use client';

import type { CategoryScore } from '@/lib/analysis/types';
import {
  Shield,
  MessageSquare,
  Zap,
  ArrowUpRight,
  Lock,
  Radio,
  AlertTriangle,
  Brain,
  Key,
  TestTube,
  FileCheck,
  CheckCircle,
  Rocket,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  agentDefinition: FileCheck,
  topicDesign: MessageSquare,
  instructionQuality: Zap,
  actionsConfig: Shield,
  escalation: ArrowUpRight,
  guardrails: Lock,
  channelConfig: Radio,
  errorHandling: AlertTriangle,
  llmGrounding: Brain,
  security: Key,
  testCoverage: TestTube,
  testExistence: TestTube,
  activation: Rocket,
};

const STAGE_STYLES: Record<string, string> = {
  designSetup: 'bg-blue-100 text-blue-700',
  configuration: 'bg-purple-100 text-purple-700',
  test: 'bg-green-100 text-green-700',
  deploy: 'bg-orange-100 text-orange-700',
  monitor: 'bg-pink-100 text-pink-700',
};

function scoreColorClass(score: number): string {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50';
  if (score >= 75) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50';
  if (score >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

function barColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function CategoryScoreGrid({
  categories,
}: {
  categories: CategoryScore[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.category] || Shield;
        return (
          <div
            key={cat.category}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-600 truncate">
                  {cat.label}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STAGE_STYLES[cat.stage] || 'bg-gray-100 text-gray-700'} flex-shrink-0`}
              >
                {cat.stage === 'designSetup' ? 'SETUP' :
                 cat.stage === 'configuration' ? 'CONFIG' :
                 cat.stage === 'test' ? 'TEST' :
                 cat.stage === 'deploy' ? 'DEPLOY' :
                 'MON'}
              </span>
            </div>
            <div className={`text-2xl font-bold ${scoreColorClass(cat.score).split(' ')[0]}`}>
              {cat.score}
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor(cat.score)}`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              {cat.failCount > 0 && (
                <span className="text-red-600">{cat.failCount} critical</span>
              )}
              {cat.warnCount > 0 && (
                <span className="text-amber-600">{cat.warnCount} warn</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
