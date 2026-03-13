import type { ReviewStage, Severity } from './types';

/**
 * Single source of truth for severity display (badges, tables, summaries).
 * Used by SeverityBadge, BestPracticeChecks, ApexView, FindingsTable, etc.
 */
export const SEVERITY_UI: Record<
  Severity,
  { label: string; className: string; dotClassName: string }
> = {
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    dotClassName: 'bg-red-500',
  },
  warning: {
    label: 'Warning',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    dotClassName: 'bg-amber-500',
  },
  info: {
    label: 'Info',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    dotClassName: 'bg-blue-500',
  },
};

/**
 * Stage display labels for tabs and filters.
 * LifecycleTabs and BestPracticeChecks should use this for consistency.
 */
export const STAGE_LABELS: Record<ReviewStage, string> = {
  designSetup: 'Design & Setup',
  configuration: 'Configuration',
  test: 'Test',
  deploy: 'Deploy',
  monitor: 'Monitor',
  data: 'Data',
  apex: 'Apex',
};
