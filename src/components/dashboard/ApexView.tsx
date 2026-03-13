import React from 'react';
import {
  Code,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Zap,
  ListOrdered,
  MessageSquare,
  FileCode,
} from 'lucide-react';
import type { Finding } from '@/lib/analysis/types';
import SeverityBadge from '@/components/ui/SeverityBadge';

interface ApexScanResult {
  classesScanned: number;
  totalClasses?: number;
  overallScore: number;
  findings: Finding[];
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
  };
}

interface ApexViewProps {
  onScan?: () => void;
  scanning?: boolean;
  scanResults?: ApexScanResult | null;
  scanError?: string | null;
}

const BEST_PRACTICES = [
  {
    id: 'invocable',
    title: 'Invocable actions',
    description: '@InvocableMethod with @InvocableVariable or List<Input> for Agentforce actions.',
    icon: Zap,
  },
  {
    id: 'sharing',
    title: 'Sharing mode',
    description: 'Explicit "with sharing" for invocable classes to enforce record-level security.',
    icon: Shield,
  },
  {
    id: 'bulkification',
    title: 'Bulkification',
    description: 'No SOQL or DML inside loops; query/collect then single DML.',
    icon: ListOrdered,
  },
  {
    id: 'error-handling',
    title: 'Error handling',
    description: 'Try-catch in invocable methods with clear, human-readable error messages.',
    icon: MessageSquare,
  },
  {
    id: 'security',
    title: 'Security & FLS',
    description: 'Use Security.stripInaccessible() or FLS checks; avoid dynamic SOQL concatenation.',
    icon: Shield,
  },
  {
    id: 'determinism',
    title: 'Determinism',
    description: 'Avoid randomness in invocable actions for predictable agent behavior.',
    icon: FileCode,
  },
];

export default function ApexView({ onScan, scanning, scanResults, scanError }: ApexViewProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-600 dark:bg-amber-500 rounded-lg flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Apex Best Practices (Agentforce)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Scan org Apex classes for Agentforce-friendly patterns: invocable design, bulkification, security, and determinism.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {scanResults ? (
              <span
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  scanResults.overallScore >= 75
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : scanResults.overallScore >= 50
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Score: {scanResults.overallScore}
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Not scanned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Best practices we check */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="border-b border-gray-200 dark:border-gray-600 px-6 py-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Best practices we score against
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Aligned with Salesforce and Agentforce Apex guidelines: invocable actions, bulkification, security, and error handling.
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BEST_PRACTICES.map((bp) => {
              const Icon = bp.icon;
              return (
                <div
                  key={bp.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600"
                >
                  <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{bp.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{bp.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scan action */}
      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Scan org Apex classes
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
              Fetches custom Apex classes via the Tooling API and runs static checks for invocable design, bulkification, security, and error handling. Test classes are included in the scan.
            </p>
            <button
              onClick={onScan}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white rounded-lg hover:bg-amber-700 dark:hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning Apex...' : 'Scan org Apex'}
            </button>
          </div>
        </div>
      </div>

      {/* Scan error */}
      {scanError && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">Scan failed</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{scanError}</p>
          </div>
        </div>
      )}

      {/* Scan results */}
      {scanResults && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Classes scanned</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {scanResults.classesScanned}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                {scanResults.summary.criticalCount}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 px-4 py-3">
              <p className="text-sm text-amber-600 dark:text-amber-400">Warnings</p>
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                {scanResults.summary.warningCount}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 px-4 py-3">
              <p className="text-sm text-blue-600 dark:text-blue-400">Info</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                {scanResults.summary.infoCount}
              </p>
            </div>
          </div>

          {scanResults.findings.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="border-b border-gray-200 dark:border-gray-600 px-6 py-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Findings ({scanResults.findings.length})
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Grouped by rule; expand to see recommendation.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left px-6 py-3 font-medium text-gray-700 dark:text-gray-300">
                        Rule
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-gray-700 dark:text-gray-300">
                        Severity
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-gray-700 dark:text-gray-300">
                        Class
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-gray-700 dark:text-gray-300">
                        Title
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-gray-700 dark:text-gray-300">
                        Recommendation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.findings.map((f, idx) => (
                      <tr
                        key={`${f.id}-${f.affectedComponent}-${idx}`}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-6 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {f.id}
                        </td>
                        <td className="px-6 py-3">
                          <SeverityBadge severity={f.severity} />
                        </td>
                        <td className="px-6 py-3 font-mono text-gray-900 dark:text-gray-100">
                          {f.affectedComponent}
                        </td>
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                          {f.title}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400 max-w-xs">
                          {f.recommendation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="font-medium text-green-800 dark:text-green-300">No issues found</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Scanned {scanResults.classesScanned} class(es); no best-practice violations detected.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
