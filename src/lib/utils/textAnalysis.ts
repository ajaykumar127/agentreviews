export function countAbsoluteTerms(text: string): number {
  const pattern = /\b(must|never|always|shall not|cannot)\b/gi;
  return (text.match(pattern) || []).length;
}

export function countNegations(text: string): number {
  const pattern = /\b(don't|do not|never|should not|shouldn't|cannot|can't)\b/gi;
  return (text.match(pattern) || []).length;
}

export function hasActionVerbs(text: string): boolean {
  const verbs = /\b(retrieve|create|update|delete|verify|check|escalate|transfer|search|query|get|send|notify|calculate|validate|confirm|fetch|lookup|find|submit|process)\b/i;
  return verbs.test(text);
}

export function referencesActionNames(instructionText: string, actionNames: string[]): boolean {
  const lower = instructionText.toLowerCase();
  return actionNames.some((name) => lower.includes(name.toLowerCase()));
}

export function calculateKeywordOverlap(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const intersection = [...words1].filter((w) => words2.has(w));
  const union = new Set([...words1, ...words2]);
  return union.size > 0 ? intersection.length / union.size : 0;
}
