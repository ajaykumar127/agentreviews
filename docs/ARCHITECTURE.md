# Architecture Overview

This document describes the modular structure introduced for consistency, reuse, and maintainability.

## Shared API Layer (`src/lib/api/`)

- **`auth.ts`** – `getAuthenticatedConnection(request)`  
  Reads `sf_session` cookie, decrypts, returns `{ ok: true, conn, session }` or `{ ok: false, response }` (401).  
  All authenticated API routes use this instead of duplicating cookie/decrypt/connection logic.

- **`responses.ts`** – `jsonError(message, status?, extra?)`, `jsonSuccess(data, status?)`  
  Standard JSON response helpers so error shape and status codes are consistent.

- **`index.ts`** – Re-exports for `import { getAuthenticatedConnection, jsonError, jsonSuccess } from '@/lib/api'`.

## Shared Analysis Constants (`src/lib/analysis/`)

- **`scoring.ts`** – `scoreToGrade(score)`, `scoreColor(score)`, `calculateCategoryScore`, `calculateOverallScore`, `calculateStageScore`, `CATEGORY_CONFIG`.  
  Single source for grade thresholds (90/75/60/40) and score→color mapping.

- **`constants.ts`** – `SEVERITY_UI` (severity → label + Tailwind classes), `STAGE_LABELS` (stage → display label).  
  Used by UI components so severity and stage styling/labels are consistent.

- **`index.ts`** – Re-exports types, scoring, constants, and `analyzeOrg`.

## Shared UI (`src/components/ui/`)

- **`SeverityBadge.tsx`** – Renders a severity pill (critical / warning / info) using `SEVERITY_UI`.  
  Used by ApexView, FindingsTable, and can be used anywhere findings are displayed.

## API Routes

These routes now use the shared layer:

- `api/analyze` – uses `getAuthenticatedConnection`, `jsonError` for errors.
- `api/scan-apex` – uses `getAuthenticatedConnection`, `jsonError`, `jsonSuccess`.
- `api/scan-datacloud` – same.
- `api/permissions-check` – same.
- `api/agents` – same.
- `api/datacloud-debug` – **fixed**: previously called `getConnection(request)` (invalid). Now uses `getAuthenticatedConnection(request)` like other routes.
- `api/debug` – uses shared auth and responses; debug output path changed to `process.cwd()/debug-output.json` for portability.
- `api/debug-objects` – same auth and response helpers.

## Components Refactored

- **CollapsibleScoreCard** – uses `scoreColor` from `@/lib/analysis/scoring` (removed local duplicate).
- **BestPracticeChecks** – uses `STAGE_LABELS` from `@/lib/analysis/constants` (with override `data: 'Data Cloud'`).
- **ApexView** – uses `SeverityBadge` for findings table.
- **FindingsTable** – uses `SeverityBadge` and `STAGE_LABELS`; stage styles extended for `data` and `apex`.
- **GradeExplanation** – uses `scoreToGrade` from `@/lib/analysis/scoring` (removed local duplicate).
- **Dashboard page** – uses `scoreToGrade` from `@/lib/analysis/scoring` (removed local duplicate).

## Fixes Applied (type safety / correctness)

- **`api/credentials/route.ts`** – `listCredentials(null)` → `listCredentials(undefined)` so the type matches `string | undefined`.
- **`api/credentials/save/route.ts`** – Same for `userId` passed to `saveCredential`.
- **`api/permissions-check/route.ts`** – Uses `session.userId` from `auth.session` for permission queries (was broken after switching to `getAuthenticatedConnection`).
- **`api/debug/route.ts`** – Debug output path uses `join(process.cwd(), 'debug-output.json')` instead of a hardcoded absolute path.
- **`ExportButton.tsx`** – Report metadata uses `report.agents[0]?.orgId` and `report.agents[0]?.apiVersion`; stage scores use actual keys (`designSetup`, `configuration`, `test`, `deploy`, `monitor`, `data`, `apex`) instead of legacy `build` / `postDeployment`.
- **`BestPracticeChecks.tsx`** – `STAGE_TOTAL_CHECKS` includes `apex`.
- **`LifecycleTimeline.tsx` (v2)** – `STAGE_CONFIG` includes `apex`; optional `stageScores[stage]` handled with `?? 100`.
- **`engine.ts`** – `ANALYZERS` includes `apexBestPractices: () => []` (Apex is run via `/api/scan-apex`, not per-agent).
- **`agentScriptDeterminism.ts`** – Safe handling of `contextVariables` and boolean args to `calculateDeterminismLevel`.

## What Stayed the Same

- No user-facing flows or behavior were changed.
- Auth routes (`api/auth/*`, `api/credentials/*`) unchanged (they establish session, not consume it).
- LifecycleTabs still has its own `STAGE_CONFIG` (icons, colors, descriptions); only stage labels are shared via constants where needed.
- Unused components (e.g. RecommendationsPanel, CategoryScoreGrid, StageScoreCard, AdvancedMetrics) were not removed so as not to break any references or future use.
