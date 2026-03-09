'use client';

import { Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { AgentReport } from '@/lib/analysis/types';

interface AgentHealthCardProps {
  agent: AgentReport;
  onClick: () => void;
}

export default function AgentHealthCard({ agent, onClick }: AgentHealthCardProps) {
  const { overallScore, stageScores, findings } = agent;

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;

  const getHealthStatus = () => {
    if (overallScore >= 90) return { label: 'Excellent', color: 'green', gradient: 'from-emerald-500 to-green-500' };
    if (overallScore >= 75) return { label: 'Good', color: 'blue', gradient: 'from-blue-500 to-cyan-500' };
    if (overallScore >= 60) return { label: 'Fair', color: 'yellow', gradient: 'from-yellow-500 to-orange-500' };
    return { label: 'Needs Attention', color: 'red', gradient: 'from-red-500 to-pink-500' };
  };

  const health = getHealthStatus();

  const stages = [
    { key: 'designSetup', label: 'Design', score: stageScores.designSetup },
    { key: 'configuration', label: 'Config', score: stageScores.configuration },
    { key: 'test', label: 'Test', score: stageScores.test },
    { key: 'deploy', label: 'Deploy', score: stageScores.deploy },
    { key: 'monitor', label: 'Monitor', score: stageScores.monitor },
  ];

  return (
    <button
      onClick={onClick}
      className="group w-full bg-white rounded-3xl border border-gray-200 hover:border-gray-300 p-6 transition-all hover:shadow-2xl hover:scale-[1.02] text-left"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
            {agent.agentName}
          </h3>
          <p className="text-sm text-gray-500">{agent.agentDeveloperName}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <div className="relative w-16 h-16">
            {/* Animated ring */}
            <svg className="absolute inset-0 w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-100"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(overallScore / 100) * 176} 176`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`text-${health.color}-500`} stopColor="currentColor" />
                  <stop offset="100%" className={`text-${health.color}-600`} stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>
            {/* Score */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold text-${health.color}-600`}>{overallScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${health.gradient} bg-opacity-10`}>
          {overallScore >= 90 ? (
            <CheckCircle2 className={`w-4 h-4 text-${health.color}-600`} />
          ) : overallScore >= 60 ? (
            <Clock className={`w-4 h-4 text-${health.color}-600`} />
          ) : (
            <AlertCircle className={`w-4 h-4 text-${health.color}-600`} />
          )}
          <span className={`text-sm font-semibold text-${health.color}-700`}>{health.label}</span>
        </div>
      </div>

      {/* Lifecycle Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lifecycle Progress</span>
          <span className="text-xs font-bold text-gray-700">
            {stages.filter(s => s.score >= 75).length}/{stages.length} Complete
          </span>
        </div>
        <div className="flex gap-1">
          {stages.map((stage) => (
            <div
              key={stage.key}
              className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100"
              title={`${stage.label}: ${stage.score}%`}
            >
              <div
                className={`h-full transition-all duration-1000 ease-out ${
                  stage.score >= 90 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                  stage.score >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                  stage.score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-pink-500'
                }`}
                style={{ width: `${stage.score}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {stages.map((stage) => (
            <span key={stage.key} className="text-[10px] text-gray-400 font-medium">{stage.label}</span>
          ))}
        </div>
      </div>

      {/* Issues Summary */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div className="flex gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-red-700">{criticalCount} Critical</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{warningCount} Warnings</span>
            </div>
          )}
        </div>
      )}

      {/* Perfect State */}
      {criticalCount === 0 && warningCount === 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">All checks passed</span>
        </div>
      )}

      {/* Hover indicator */}
      <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600">
          <span>View Details</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
