'use client';

import { useState } from 'react';
import type { Finding, CategoryId } from '@/lib/analysis/types';
import { CATEGORY_CONFIG } from '@/lib/analysis/scoring';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function RecommendationsPanel({
  findings,
}: {
  findings: Finding[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Group by category, only include critical and warning
  const actionable = findings.filter((f) => f.severity !== 'info');
  const grouped: Record<string, Finding[]> = {};
  for (const f of actionable) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  const categories = Object.entries(grouped).sort(
    (a, b) => b[1].length - a[1].length
  );

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="text-emerald-600 text-lg font-semibold">
          No critical or warning issues found!
        </div>
        <p className="text-gray-500 mt-1 text-sm">Your agent configuration looks great.</p>
      </div>
    );
  }

  const toggle = (cat: string) => {
    const next = new Set(expanded);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpanded(next);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">
          Recommendations ({actionable.length} items)
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {categories.map(([categoryId, catFindings]) => {
          const isOpen = expanded.has(categoryId);
          const label = CATEGORY_CONFIG[categoryId as CategoryId]?.label || categoryId;
          const critCount = catFindings.filter((f) => f.severity === 'critical').length;
          const warnCount = catFindings.filter((f) => f.severity === 'warning').length;

          return (
            <div key={categoryId}>
              <button
                onClick={() => toggle(categoryId)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-900 flex-1">
                  {label}
                </span>
                {critCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    {critCount} critical
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    {warnCount} warning
                  </span>
                )}
              </button>
              {isOpen && (
                <div className="px-8 pb-4 space-y-3">
                  {catFindings.map((f, idx) => (
                    <div
                      key={`${f.id}-${idx}`}
                      className="border-l-2 pl-3"
                      style={{
                        borderColor:
                          f.severity === 'critical' ? '#dc2626' : '#f59e0b',
                      }}
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {f.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {f.recommendation}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {f.affectedComponent}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
