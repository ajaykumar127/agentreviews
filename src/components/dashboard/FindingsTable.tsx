'use client';

import { useState } from 'react';
import type { Finding } from '@/lib/analysis/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { STAGE_LABELS } from '@/lib/analysis/constants';

const STAGE_STYLES: Record<string, string> = {
  designSetup: 'bg-blue-50 text-blue-700 border-blue-200',
  configuration: 'bg-purple-50 text-purple-700 border-purple-200',
  test: 'bg-green-50 text-green-700 border-green-200',
  deploy: 'bg-orange-50 text-orange-700 border-orange-200',
  monitor: 'bg-pink-50 text-pink-700 border-pink-200',
  data: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  apex: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function FindingsTable({ findings }: { findings: Finding[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = [...new Set(findings.map((f) => f.category))];

  const filtered = findings.filter((f) => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    return true;
  });

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = [...filtered].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
        <h3 className="text-sm font-semibold text-gray-900 mr-auto">
          Findings ({filtered.length})
        </h3>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center text-gray-400">No findings match your filters.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sorted.map((finding, idx) => {
            const key = `${finding.id}-${finding.affectedComponent}-${idx}`;
            const isExpanded = expandedId === key;
            return (
              <div key={key}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : key)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <SeverityBadge severity={finding.severity} />
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded border ${STAGE_STYLES[finding.stage] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                  >
                    {(STAGE_LABELS[finding.stage] || finding.stage).toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{finding.id}</span>
                  <span className="text-sm text-gray-900 font-medium flex-1">
                    {finding.title}
                  </span>
                  <span className="text-xs text-gray-500 hidden md:block">
                    {finding.affectedComponent}
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-12 pb-4 space-y-2">
                    <p className="text-sm text-gray-600">{finding.description}</p>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Recommendation: </span>
                        {finding.recommendation}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Affected: {finding.affectedComponent}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
