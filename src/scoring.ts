/**
 * Scoring engine
 * Calculates trust score from security findings
 */

import type { Finding, Status, Severity } from './types.js';

/**
 * Severity point deductions
 */
const SEVERITY_POINTS: Record<Severity, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
  INFO: 0
};

/**
 * Calculate trust score from findings
 * Score starts at 100 and deductions are made for each finding
 */
export function calculateScore(findings: Finding[]): number {
  let score = 100;

  for (const finding of findings) {
    const deduction = SEVERITY_POINTS[finding.severity];
    score -= deduction;
  }

  // Floor at 0
  return Math.max(0, score);
}

/**
 * Determine overall status from score
 */
export function determineStatus(score: number): Status {
  if (score >= 80) return 'PASS';
  if (score >= 50) return 'WARN';
  if (score >= 20) return 'FAIL';
  return 'DANGER';
}

/**
 * Generate recommendation based on status and findings
 */
export function generateRecommendation(
  status: Status,
  findings: Finding[]
): string {
  // Check for critical permission mismatches or exfiltration
  const hasCriticalMismatch = findings.some(
    f => f.severity === 'CRITICAL' && f.category === 'permission-mismatch'
  );

  const hasExfiltration = findings.some(
    f => f.category.includes('exfiltration') || f.title.toLowerCase().includes('exfiltrate')
  );

  const hasPromptInjection = findings.some(
    f => f.category === 'prompt-injection' && f.severity === 'CRITICAL'
  );

  if (hasCriticalMismatch || hasExfiltration) {
    return 'Do not install. Undeclared data exfiltration detected.';
  }

  if (hasPromptInjection) {
    return 'Do not install. Prompt injection attempt detected.';
  }

  switch (status) {
    case 'DANGER':
      return 'Do not install. Skill presents severe security risks.';

    case 'FAIL':
      return 'Do not install without thorough review. Multiple security issues detected.';

    case 'WARN':
      return 'Review recommended. Some security concerns detected.';

    case 'PASS':
      return findings.length === 0
        ? 'Skill appears safe to install.'
        : 'Skill appears relatively safe, but review findings.';

    default:
      return 'Unable to determine safety.';
  }
}

/**
 * Get severity counts from findings
 */
export function getSeverityCounts(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0
  };

  for (const finding of findings) {
    counts[finding.severity]++;
  }

  return counts;
}
