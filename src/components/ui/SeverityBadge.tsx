import React from 'react';
import type { Severity } from '@/lib/analysis/types';
import { SEVERITY_UI } from '@/lib/analysis/constants';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showDot?: boolean;
}

/**
 * Shared severity badge for findings (critical / warning / info).
 * Use in tables, cards, and summaries for consistent styling.
 */
export default function SeverityBadge({
  severity,
  className = '',
  showDot = false,
}: SeverityBadgeProps) {
  const ui = SEVERITY_UI[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${ui.className} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${ui.dotClassName}`} />}
      {ui.label}
    </span>
  );
}
