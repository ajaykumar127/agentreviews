import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedConnection, jsonError, jsonSuccess } from '@/lib/api';
import { analyzeApexClasses } from '@/lib/analysis/rules/apex';
import { calculateCategoryScore } from '@/lib/analysis/scoring';

export interface ApexClassRecord {
  Id: string;
  Name: string;
  Body?: string;
  NamespacePrefix?: string | null;
}

export async function POST(request: NextRequest) {
  const auth = getAuthenticatedConnection(request);
  if (!auth.ok) return auth.response;
  const conn = auth.conn;

  try {

    // Fetch Apex classes via Tooling API. Try multiple query strategies so we work across orgs.
    let classes: ApexClassRecord[] = [];
    const queriesToTry = [
      // 1) Simplest – all classes with Body (no WHERE, no extra fields)
      `SELECT Id, Name, Body FROM ApexClass LIMIT 250`,
      // 2) With namespace so we can prefer custom classes
      `SELECT Id, Name, Body, NamespacePrefix FROM ApexClass LIMIT 250`,
      // 3) If Body fails (e.g. permission), at least get class list
      `SELECT Id, Name FROM ApexClass LIMIT 250`,
    ];

    let lastError: string | null = null;
    for (const soql of queriesToTry) {
      try {
        const result = await conn.tooling.query<ApexClassRecord>(soql);
        classes = result.records || [];
        lastError = null;
        break; // success – use this result (even if 0 records)
      } catch (queryErr: unknown) {
        lastError = queryErr instanceof Error ? queryErr.message : String(queryErr);
        continue; // try next query
      }
    }

    if (classes.length === 0) {
      const hint = lastError
        ? ` Query error: ${lastError}. You may need "View All Data" or "Author Apex".`
        : ' Your org may have no Apex classes, or they may be in a managed package.';
      return jsonSuccess({ error: `No Apex classes could be read.${hint}` });
    }

    // Prefer custom (non-managed) classes when we have NamespacePrefix
    const customClasses = classes.filter(
      (c) => c.NamespacePrefix == null || c.NamespacePrefix === ''
    );
    const toScan = customClasses.length > 0 ? customClasses : classes;

    const sources = toScan
      .filter((c) => c.Body != null && String(c.Body).trim().length > 0)
      .map((c) => ({ Name: c.Name, Body: c.Body!, Id: c.Id }));

    if (toScan.length > 0 && sources.length === 0) {
      return jsonSuccess({
        error: `Found ${toScan.length} Apex class(es) but could not read class Body. Ensure your user has "Author Apex" or "View All Data" so the Tooling API can return Apex source.`,
      });
    }

    const findings = analyzeApexClasses(sources);
    const overallScore = calculateCategoryScore(findings);

    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const warningCount = findings.filter((f) => f.severity === 'warning').length;
    const infoCount = findings.filter((f) => f.severity === 'info').length;

    return jsonSuccess({
      classesScanned: sources.length,
      totalClasses: classes.length,
      overallScore: Math.round(overallScore),
      findings,
      summary: { criticalCount, warningCount, infoCount },
    });
  } catch (error) {
    console.error('Apex scan error:', error);
    return jsonError(error instanceof Error ? error.message : 'Apex scan failed', 500);
  }
}
