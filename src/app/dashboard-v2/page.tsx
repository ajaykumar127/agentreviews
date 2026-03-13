'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisReport, AgentReport, ReviewStage } from '@/lib/analysis/types';
import { LogOut, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import AgentHealthCard from '@/components/v2/AgentHealthCard';
import LifecycleTimeline from '@/components/v2/LifecycleTimeline';
import SmartInsights from '@/components/v2/SmartInsights';

export default function DashboardV2Page() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentReport | null>(null);
  const [selectedStage, setSelectedStage] = useState<ReviewStage | null>(null);

  const runAnalysis = async () => {
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setStatus('error');
        return;
      }
      setReport(data as AnalysisReport);
      setStatus('done');
    } catch {
      setError('Analysis failed. Please try again.');
      setStatus('error');
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const handleLogout = () => {
    document.cookie = 'sf_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-[#0c0e14] dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Agentforce Agent Review Toolkit ⚡
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Version 2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
            >
              ← Back to V1
            </button>
            <button
              onClick={runAnalysis}
              disabled={status === 'loading'}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
              <ThemeToggle size="sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State - X-Ray Scanner */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32">
            {/* X-Ray Scanner Animation */}
            <div className="relative mb-8">
              {/* Agent Icon */}
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 text-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Robot/Agent Head */}
                  <rect x="6" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <circle cx="9.5" cy="8" r="1" fill="currentColor"/>
                  <circle cx="14.5" cy="8" r="1" fill="currentColor"/>
                  <path d="M9 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="10" y="2" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M6 9h-1.5M18 9h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  {/* Robot Body */}
                  <rect x="8" y="14" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M10 16h4M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>

                {/* Scanning Beam - Vertical */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 blur-sm animate-scan-vertical shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>
                </div>

                {/* X-Ray Glow Effect */}
                <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-10 blur-2xl animate-pulse"></div>
              </div>

              {/* Grid Lines (X-Ray Feel) */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="grid grid-cols-4 grid-rows-4 w-32 h-32">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="border border-cyan-500/30"></div>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="inline-block animate-pulse text-cyan-600">⚡</span>
              Running Agent X-Ray Scan
              <span className="inline-block animate-pulse text-cyan-600">⚡</span>
            </h2>
            <p className="text-gray-600 text-center max-w-md">
              Peering through the code layers... examining topics, actions, and guardrails under the microscope 🔬
            </p>

            {/* Fun Loading Dots */}
            <div className="flex gap-1 mt-6">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="max-w-2xl mx-auto mt-32">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Analysis Failed</h2>
              <p className="text-gray-600 mb-8">{error}</p>
              <button
                onClick={runAnalysis}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Success State - Agent Dashboard */}
        {status === 'done' && report && !selectedAgent && (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 mb-1">{report.agents.length}</div>
                <div className="text-sm text-gray-600">Total Agents</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 mb-1">{Math.round(report.summary.averageScore)}</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="text-3xl font-bold text-red-600 mb-1">{report.summary.criticalCount}</div>
                <div className="text-sm text-gray-600">Critical Issues</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="text-3xl font-bold text-amber-600 mb-1">{report.summary.warningCount}</div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
            </div>

            {/* Agent Cards Grid */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Agents</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {report.agents.map((agent) => (
                  <AgentHealthCard
                    key={agent.agentDeveloperName}
                    agent={agent}
                    onClick={() => setSelectedAgent(agent)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Agent Detail View */}
        {status === 'done' && selectedAgent && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedAgent(null);
                setSelectedStage(null);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to All Agents
            </button>

            {/* Agent Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{selectedAgent.agentName}</h1>
                  <p className="text-blue-100">{selectedAgent.agentDeveloperName}</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold mb-1">{selectedAgent.overallScore}</div>
                  <div className="text-sm text-blue-100">Overall Score</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Lifecycle Timeline */}
              <div className="lg:col-span-2">
                <LifecycleTimeline
                  agent={selectedAgent}
                  selectedStage={selectedStage}
                  onStageSelect={setSelectedStage}
                />
              </div>

              {/* Smart Insights */}
              <div className="lg:col-span-3">
                <SmartInsights
                  findings={selectedAgent.findings}
                  selectedStage={selectedStage}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
