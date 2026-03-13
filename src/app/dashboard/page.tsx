'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisReport, AgentReport, ReviewStage } from '@/lib/analysis/types';
import { scoreToGrade } from '@/lib/analysis/scoring';
import CollapsibleScoreCard from '@/components/dashboard/CollapsibleScoreCard';
import ExportButton from '@/components/dashboard/ExportButton';
import LifecycleTabs from '@/components/dashboard/LifecycleTabs';
import BestPracticeChecks from '@/components/dashboard/BestPracticeChecks';
import DataCloudView from '@/components/dashboard/DataCloudView';
import ApexView from '@/components/dashboard/ApexView';
import BestPracticesGuide from '@/components/dashboard/BestPracticesGuide';
import GradeExplanation from '@/components/dashboard/GradeExplanation';
import DeepDiagnostics from '@/components/dashboard/DeepDiagnostics';
import { LogOut, RefreshCw, AlertCircle, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

type Status = 'idle' | 'loading-agents' | 'analyzing' | 'done' | 'error';

interface DebugInfo {
  [key: string]: { count?: number; records?: { Id: string; DeveloperName: string; MasterLabel: string }[]; error?: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<'all' | ReviewStage>('all');
  const [error, setError] = useState('');
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [dataCloudScan, setDataCloudScan] = useState<any>(null);
  const [showDataCloudScan, setShowDataCloudScan] = useState(false);
  const [scanningDataCloud, setScanningDataCloud] = useState(false);
  const [showBestPractices, setShowBestPractices] = useState(false);
  const [permissionsCheck, setPermissionsCheck] = useState<any>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [showGradeExplanation, setShowGradeExplanation] = useState(false);
  const [showDeepDiagnostics, setShowDeepDiagnostics] = useState(false);
  const [apexScanResult, setApexScanResult] = useState<any>(null);
  const [scanningApex, setScanningApex] = useState(false);

  const runDebug = async () => {
    try {
      const res = await fetch('/api/debug-objects', { method: 'POST' });
      const data = await res.json();
      setDebugData(data);
      setShowDebug(true);
    } catch (err) {
      console.error('Debug failed:', err);
    }
  };

  const runDataCloudScan = async () => {
    setScanningDataCloud(true);
    try {
      const res = await fetch('/api/scan-datacloud', { method: 'POST' });
      const data = await res.json();
      setDataCloudScan(data);
      setShowDataCloudScan(true);
    } catch (err) {
      console.error('Data Cloud scan failed:', err);
    } finally {
      setScanningDataCloud(false);
    }
  };

  const runApexScan = async () => {
    setScanningApex(true);
    try {
      const res = await fetch('/api/scan-apex', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setApexScanResult(data);
    } catch (err) {
      console.error('Apex scan failed:', err);
      setApexScanResult({ error: err instanceof Error ? err.message : 'Scan failed' });
    } finally {
      setScanningApex(false);
    }
  };

  const runPermissionsCheck = async () => {
    setCheckingPermissions(true);
    try {
      const res = await fetch('/api/permissions-check', { method: 'POST' });
      const data = await res.json();
      setPermissionsCheck(data);
      setShowPermissions(true);
    } catch (err) {
      console.error('Permissions check failed:', err);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const runAnalysis = async () => {
    setStatus('analyzing');
    setError('');
    setDebugInfo(null);

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
      if (data.debug) {
        setDebugInfo(data.debug as DebugInfo);
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

  // Get current agent report or combined view
  const currentReport: AgentReport | null =
    report && selectedAgent !== 'all'
      ? report.agents.find((a) => a.agentDeveloperName === selectedAgent) || null
      : null;

  const allFindings = currentReport
    ? currentReport.findings
    : report?.agents.flatMap((a) => a.findings) || [];

  // Filter by selected stage
  const displayFindings = selectedStage === 'all'
    ? allFindings
    : allFindings.filter((f) => f.stage === selectedStage);

  const displayScore = currentReport
    ? currentReport.overallScore
    : report?.summary.averageScore || 0;

  const displayGrade = currentReport
    ? currentReport.overallGrade
    : report
      ? scoreToGrade(report.summary.averageScore)
      : 'F';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0e14]">
      {/* Best Practices Guide Modal */}
      <BestPracticesGuide
        isOpen={showBestPractices}
        onClose={() => setShowBestPractices(false)}
      />

      {/* Grade Explanation Modal */}
      {currentReport && (
        <GradeExplanation
          report={currentReport}
          isOpen={showGradeExplanation}
          onClose={() => setShowGradeExplanation(false)}
        />
      )}

      {/* Deep Diagnostics Modal */}
      {currentReport && (
        <DeepDiagnostics
          report={currentReport}
          isOpen={showDeepDiagnostics}
          onClose={() => setShowDeepDiagnostics(false)}
        />
      )}

      {/* Permissions Check Modal */}
      {showPermissions && permissionsCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Permissions & Access Check</h2>
              </div>
              <button
                onClick={() => setShowPermissions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Recommendations */}
              {permissionsCheck.recommendations && permissionsCheck.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Recommendations</h3>
                  {permissionsCheck.recommendations.map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        rec.severity === 'critical'
                          ? 'bg-red-50 border-red-200'
                          : rec.severity === 'high'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
                      <p className="text-sm text-gray-700 mb-2">{rec.message}</p>
                      {Array.isArray(rec.solution) ? (
                        <div className="text-sm text-gray-600 space-y-1">
                          {rec.solution.map((s: string, i: number) => (
                            <div key={i}>{s}</div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">{rec.solution}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Accessible Objects */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Agentforce Object Access</h3>
                <div className="space-y-2">
                  {permissionsCheck.accessibleObjects?.map((obj: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        obj.accessible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-gray-900">{obj.object}</span>
                        <span className="text-xs px-2 py-1 bg-white rounded">{obj.api} API</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {obj.accessible ? (
                          <>
                            <span className="text-xs text-green-700">{obj.recordCount} records</span>
                            <span className="text-green-600">✓</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-red-700">{obj.error}</span>
                            <span className="text-red-600">✗</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Robot/Agent Head */}
                <rect x="6" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="9.5" cy="8" r="1" fill="currentColor"/>
                <circle cx="14.5" cy="8" r="1" fill="currentColor"/>
                <path d="M9 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="10" y="2" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M6 9h-1.5M18 9h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                {/* Magnifying Glass/Lens */}
                <circle cx="16.5" cy="16.5" r="3.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
                <path d="M19 19l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agentforce Agent Review Toolkit ⚡</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-indigo-600 font-medium">by Ajay Kumar Kambadkone Suresh</p>
                <span className="text-gray-300">•</span>
                <p className="text-xs text-gray-500">Version 1.0</p>
                {/* Subtle Beta v2 Toggle */}
                <button
                  onClick={() => router.push('/dashboard-v2')}
                  className="group flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-300 transition-all"
                  title="Try the new enhanced visualization"
                >
                  <Sparkles className="w-2.5 h-2.5 group-hover:animate-pulse" />
                  <span>Version 2.0 ( Beta )</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runPermissionsCheck}
              disabled={checkingPermissions}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-all disabled:opacity-50"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${checkingPermissions ? 'animate-spin' : ''}`} />
              Permissions
            </button>
            {report && (
              <>
                <button
                  onClick={() => setShowGradeExplanation(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-all"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Grade
                </button>
                <button
                  onClick={() => setShowDeepDiagnostics(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Diagnostics
                </button>
              </>
            )}
            <button
              onClick={() => setShowBestPractices(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </button>
            {report && <ExportButton report={report} />}
            <button
              onClick={runAnalysis}
              disabled={status === 'analyzing'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'analyzing' ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
              <ThemeToggle size="sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Disclaimer Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/90 border-l-4 border-blue-600 dark:border-blue-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                📋 About This Tool
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  <strong>This tool performs a high-level org metadata scan</strong> to highlight Agentforce best practices that may not be followed in your agent implementation. It analyzes your agent's configuration, topics, actions, instructions, and deployment settings against Salesforce recommended guidelines.
                </p>
                <p>
                  <strong>⚠️ Important Limitations:</strong> This analysis focuses on <em>traditional implementation patterns</em> and standard Salesforce best practices. It cannot catch all edge cases, custom business logic, or patterns that lie outside typical Agentforce implementations. Complex conversation flows, custom integrations, and organization-specific requirements require manual review.
                </p>
                <p className="text-blue-800 font-medium">
                  🔧 <strong>You will have the joy of troubleshooting agents at your own will.</strong> Use this tool as a starting point for your review process, not as a comprehensive audit. Always test your agents thoroughly in your specific use cases.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {status === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-24">
            {/* X-Ray Scanner Animation */}
            <div className="relative mb-6">
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

            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="inline-block animate-pulse text-cyan-600">⚡</span>
              Running Agent X-Ray Scan
              <span className="inline-block animate-pulse text-cyan-600">⚡</span>
            </h2>
            <p className="text-gray-500 mt-2 text-sm text-center max-w-md">
              Peering through the code layers... examining topics, actions, and guardrails under the microscope 🔬
            </p>

            {/* Fun Loading Dots */}
            <div className="flex gap-1 mt-4">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Analysis Failed</h2>
            <p className="text-red-600 mt-1 text-sm">{error}</p>
            <button
              onClick={runAnalysis}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {status === 'done' && report && (
          <>
            {/* Agent Selector (if multiple agents) */}
            {report.agents.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">View Agent:</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
                >
                  <option value="all">All Agents (Average)</option>
                  {report.agents.map((a) => (
                    <option key={a.agentDeveloperName} value={a.agentDeveloperName}>
                      {a.agentName} - Score: {a.overallScore}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Agent Development Lifecycle Tabs */}
            {report.agents.length > 0 && (
              <LifecycleTabs
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
                stageScores={
                  currentReport?.stageScores
                    ? {
                        ...currentReport.stageScores,
                        ...(apexScanResult?.overallScore != null && { apex: apexScanResult.overallScore }),
                      }
                    : undefined
                }
              />
            )}

            {/* No agents found */}
            {report.agents.length === 0 && (
              <div className="max-w-2xl mx-auto py-16 text-center">
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
                  <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">No Agentforce Agents Found</h2>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any Agentforce agents in your org. This could be because:
                  </p>
                  <div className="text-left bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">1</div>
                      <div>
                        <p className="font-medium text-gray-900">No agents have been created yet</p>
                        <p className="text-sm text-gray-600">Create your first agent in Setup → Einstein Setup → Agents</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">2</div>
                      <div>
                        <p className="font-medium text-gray-900">Agentforce is not enabled</p>
                        <p className="text-sm text-gray-600">Enable Einstein Copilot and Agentforce in Setup</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">3</div>
                      <div>
                        <p className="font-medium text-gray-900">Insufficient permissions</p>
                        <p className="text-sm text-gray-600">Ensure you have View All Data or Modify All Data permission</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={runAnalysis}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={runDebug}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Debug - Find Objects
                    </button>
                  </div>

                  {/* Debug Results */}
                  {showDebug && debugData && (
                    <div className="mt-8 text-left">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Results</h3>

                      {/* Successful Objects */}
                      {debugData.successfulObjects && debugData.successfulObjects.length > 0 && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-3">✓ Found Objects ({debugData.successfulObjects.length})</h4>
                          {debugData.successfulObjects.map((obj: any) => (
                            <div key={obj.object} className="mb-3 p-3 bg-white rounded border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono font-semibold text-green-800">{obj.object}</span>
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                  {obj.count} records • {obj.api} API
                                </span>
                              </div>
                              {obj.records && obj.records.length > 0 && (
                                <div className="text-sm space-y-1">
                                  {obj.records.map((r: any, idx: number) => (
                                    <div key={idx} className="text-gray-700">
                                      • {r.Name} {r.DeveloperName !== 'N/A' && `(${r.DeveloperName})`}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Available Objects */}
                      {debugData.availableObjects && debugData.availableObjects.length > 0 && (
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-3">Available Agent-Related Objects</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {debugData.availableObjects.map((obj: any) => (
                              <div key={obj.name} className="text-sm p-2 bg-white rounded border border-blue-100">
                                <div className="font-mono font-medium text-blue-800">{obj.name}</div>
                                <div className="text-xs text-gray-600">{obj.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All Query Results */}
                      <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <summary className="font-semibold text-gray-900 cursor-pointer">View All Query Results</summary>
                        <pre className="mt-3 text-xs overflow-auto max-h-96 bg-white p-3 rounded border border-gray-200">
                          {JSON.stringify(debugData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}

            {report.agents.length > 0 && (
              <>
                {/* Summary Bar */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Agents: </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{report.summary.totalAgents}</span>
                  </div>
                  <div className="bg-red-50 rounded-lg border border-red-100 px-4 py-2 text-sm">
                    <span className="text-red-600 font-semibold">{report.summary.criticalCount}</span>
                    <span className="text-red-500 ml-1">Critical</span>
                  </div>
                  <div className="bg-amber-50 rounded-lg border border-amber-100 px-4 py-2 text-sm">
                    <span className="text-amber-600 font-semibold">{report.summary.warningCount}</span>
                    <span className="text-amber-500 ml-1">Warnings</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg border border-blue-100 px-4 py-2 text-sm">
                    <span className="text-blue-600 font-semibold">{report.summary.infoCount}</span>
                    <span className="text-blue-500 ml-1">Info</span>
                  </div>
                  <div className="text-xs text-gray-400 ml-auto">
                    Analyzed: {new Date(report.analyzedAt).toLocaleString()}
                  </div>
                </div>

                {/* Collapsible Score Card with Mathematical Explanation */}
                {currentReport && (
                  <div className="max-w-4xl mx-auto">
                    <CollapsibleScoreCard report={currentReport} />
                  </div>
                )}

                {/* Data Cloud Configuration View (when Data tab selected) */}
                {selectedStage === 'data' && (
                  <DataCloudView
                    dataCloudInfo={
                      currentReport?.dataCloudInfo ||
                      report?.agents[0]?.dataCloudInfo
                    }
                    onScan={runDataCloudScan}
                    scanning={scanningDataCloud}
                    scanResults={dataCloudScan}
                  />
                )}
                {/* Apex Best Practices View (when Apex tab selected) */}
                {selectedStage === 'apex' && (
                  <ApexView
                    onScan={runApexScan}
                    scanning={scanningApex}
                    scanResults={apexScanResult?.error ? null : apexScanResult}
                    scanError={apexScanResult?.error || null}
                  />
                )}
                {/* Best Practice Checks by Lifecycle Stage (other tabs) */}
                {selectedStage !== 'data' && selectedStage !== 'apex' && (
                  <BestPracticeChecks
                    findings={displayFindings}
                    stage={selectedStage}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Grade Explanation Modal */}
      {currentReport && (
        <GradeExplanation
          report={currentReport}
          isOpen={showGradeExplanation}
          onClose={() => setShowGradeExplanation(false)}
        />
      )}

      {/* Deep Diagnostics Modal */}
      {currentReport && (
        <DeepDiagnostics
          report={currentReport}
          isOpen={showDeepDiagnostics}
          onClose={() => setShowDeepDiagnostics(false)}
        />
      )}
    </div>
  );
}
