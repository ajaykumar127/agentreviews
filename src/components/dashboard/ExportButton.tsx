'use client';

import type { AnalysisReport } from '@/lib/analysis/types';
import { Download } from 'lucide-react';

export default function ExportButton({ report }: { report: AnalysisReport }) {
  const handleExport = () => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentforce-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
    >
      <Download className="w-4 h-4" />
      Export JSON
    </button>
  );
}
