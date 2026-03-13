import type { Finding } from '../types';

export interface ApexClassSource {
  Name: string;
  Body: string;
  Id?: string;
}

/**
 * Apex best-practice rules, with emphasis on Agentforce (invocable actions, bulkification, security).
 * Scans class bodies via static pattern checks and returns findings.
 */
export function analyzeApexClasses(classes: ApexClassSource[]): Finding[] {
  const findings: Finding[] = [];

  for (const cls of classes) {
    const name = cls.Name;
    const body = cls.Body || '';
    const normalized = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''); // strip block & line comments for pattern matching

    // Skip test classes for some rules (they often have intentional patterns)
    const isTestClass = /@isTest|@\(SeeAllData\s*=\s*true\)/.test(body) || name.endsWith('Test');

    // --- Agentforce / Invocable ---

    if (body.includes('@InvocableMethod')) {
      if (!body.includes('@InvocableVariable') && !/List\s*<\s*\w+\s*>/.test(body)) {
        findings.push({
          id: 'APEX-001',
          category: 'apexBestPractices',
          stage: 'apex',
          severity: 'warning',
          title: 'Invocable method should have @InvocableVariable inputs',
          description: `Class "${name}" has @InvocableMethod but no @InvocableVariable or List<Input> parameter. Agentforce actions need clearly defined inputs for the agent to map parameters.`,
          recommendation: 'Add @InvocableVariable on input properties or use a List<Input> wrapper with @InvocableVariable fields for bulkification.',
          affectedComponent: name,
        });
      }
      if (!/with\s+sharing/i.test(body) && !/without\s+sharing/i.test(body) && !isTestClass) {
        findings.push({
          id: 'APEX-002',
          category: 'apexBestPractices',
          stage: 'apex',
          severity: 'warning',
          title: 'Invocable class should declare sharing mode',
          description: `Class "${name}" contains @InvocableMethod but does not declare "with sharing" or "without sharing". Default is with sharing; explicit declaration is a best practice for security.`,
          recommendation: 'Add "with sharing" to the class declaration to enforce record-level security for Agentforce actions.',
          affectedComponent: name,
        });
      }
      if (!/try\s*\{[\s\S]*catch\s*\(/m.test(body)) {
        findings.push({
          id: 'APEX-003',
          category: 'apexBestPractices',
          stage: 'apex',
          severity: 'warning',
          title: 'Invocable method should use try-catch',
          description: `Class "${name}" has @InvocableMethod but no try-catch. Unhandled exceptions produce generic errors for the agent and end user.`,
          recommendation: 'Wrap invocable logic in try-catch and return structured, human-readable error messages.',
          affectedComponent: name,
        });
      }
      if (!/invocable\s*\(.*label\s*=/i.test(body) && !/description\s*=/i.test(body)) {
        findings.push({
          id: 'APEX-004',
          category: 'apexBestPractices',
          stage: 'apex',
          severity: 'info',
          title: 'Invocable should have label and description',
          description: `Class "${name}" invocable annotations may lack label or description. Clear labels and descriptions help the Atlas Reasoning Engine plan and execute actions.`,
          recommendation: 'Add label and description to @InvocableMethod and @InvocableVariable for better agent reasoning.',
          affectedComponent: name,
        });
      }
    }

    // --- Bulkification (SOQL/DML in loops) ---

    const forLoopMatch = normalized.match(/for\s*\([^)]+\)\s*\{[\s\S]*?\}/gm);
    if (forLoopMatch) {
      for (const loop of forLoopMatch) {
        if (/\b(select\s+[\w\s,.*()]+from\s+\w+)/i.test(loop) || /Database\.query\s*\(/i.test(loop)) {
          findings.push({
            id: 'APEX-005',
            category: 'apexBestPractices',
            stage: 'apex',
            severity: 'critical',
            title: 'SOQL inside loop (bulkification)',
            description: `Class "${name}" appears to run SOQL inside a loop. This can hit governor limits and is an anti-pattern for bulk operations.`,
            recommendation: 'Query once outside the loop into a list/map, then iterate over the collection.',
            affectedComponent: name,
          });
          break;
        }
        if (/\b(insert|update|delete|upsert)\s+[\w\[\]]+/i.test(loop) || /Database\.(insert|update|delete|upsert)\s*\(/i.test(loop)) {
          findings.push({
            id: 'APEX-006',
            category: 'apexBestPractices',
            stage: 'apex',
            severity: 'critical',
            title: 'DML inside loop (bulkification)',
            description: `Class "${name}" appears to run DML inside a loop. This can hit governor limits.`,
            recommendation: 'Collect records in a list and perform a single DML call outside the loop.',
            affectedComponent: name,
          });
          break;
        }
      }
    }

    // --- Security ---

    if (!isTestClass && body.includes('without sharing') && body.includes('@InvocableMethod')) {
      findings.push({
        id: 'APEX-007',
        category: 'apexBestPractices',
        stage: 'apex',
        severity: 'warning',
        title: 'Invocable class uses "without sharing"',
        description: `Class "${name}" is invocable and declares "without sharing". This can expose records the running user should not access.`,
        recommendation: 'Prefer "with sharing" for Agentforce actions; use "without sharing" only when necessary and document why.',
        affectedComponent: name,
      });
    }

    // Dynamic SOQL with string concatenation (injection risk)
    if (/(\bDatabase\.query\s*\(\s*['"]\s*\+|query\s*\(\s*['"]\s*\+|\[SELECT\s+.*\]\s*\+)/i.test(normalized)) {
      findings.push({
        id: 'APEX-008',
        category: 'apexBestPractices',
        stage: 'apex',
        severity: 'critical',
        title: 'Dynamic SOQL with string concatenation',
        description: `Class "${name}" may build SOQL with string concatenation, which can lead to injection.`,
        recommendation: 'Use bind variables (e.g. :var) in dynamic SOQL and validate/sanitize any user input.',
        affectedComponent: name,
      });
    }

    // FLS / stripInaccessible (recommended for Agentforce)
    const hasDmlOrQuery = /\b(insert|update|delete|select|Database\.(query|insert|update|delete))/i.test(body);
    if (hasDmlOrQuery && body.includes('@InvocableMethod') && !/stripInaccessible|Schema\.describeSObject|isAccessible|isCreateable|isUpdateable/i.test(body)) {
      findings.push({
        id: 'APEX-009',
        category: 'apexBestPractices',
        stage: 'apex',
        severity: 'info',
        title: 'Consider enforcing FLS in invocable action',
        description: `Class "${name}" performs DML/SOQL but does not use stripInaccessible or FLS checks. Restricting to necessary fields and enforcing FLS improves security.`,
        recommendation: 'Use Security.stripInaccessible() before DML or check describeSObject().isAccessible() for SOQL.',
        affectedComponent: name,
      });
    }

    // --- Governor limits awareness ---

    if (body.includes('LIMIT 50000') || body.includes('LIMIT 10000')) {
      findings.push({
        id: 'APEX-010',
        category: 'apexBestPractices',
        stage: 'apex',
        severity: 'info',
        title: 'High LIMIT in SOQL',
        description: `Class "${name}" uses a high LIMIT value. In transactions with many operations this can approach governor limits.`,
        recommendation: 'Use a lower LIMIT where possible and consider Limits.getQueryRows() to stay within limits.',
        affectedComponent: name,
      });
    }

    // --- Determinism (Agentforce) ---

    if (body.includes('@InvocableMethod') && (/\bMath\.random\b|\bnew\s+Random\s*\(\)|Crypto\.getRandomLong/i.test(body))) {
      findings.push({
        id: 'APEX-011',
        category: 'apexBestPractices',
        stage: 'apex',
        severity: 'warning',
        title: 'Non-deterministic logic in invocable action',
        description: `Class "${name}" uses random number generation. Agent actions should be deterministic when possible for predictable agent behavior.`,
        recommendation: 'Reserve randomness for specific use cases (e.g. sampling); document why non-determinism is required.',
        affectedComponent: name,
      });
    }
  }

  return findings;
}
