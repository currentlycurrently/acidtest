/**
 * Reporter
 * Formats scan results for terminal output with colors
 */

import chalk from 'chalk';
import type { ScanResult, Finding, Status, Severity } from './types.js';

/**
 * Report scan results to terminal
 */
export function reportToTerminal(result: ScanResult): void {
  console.log();
  console.log(chalk.bold(`AcidTest v${result.version}`));
  console.log();
  console.log(`Scanning: ${chalk.cyan(result.skill.name)}`);
  console.log(`Source:   ${chalk.dim(result.skill.path)}`);
  console.log();
  console.log(chalk.dim('━'.repeat(60)));
  console.log();

  // Trust score with colored bar
  const scoreBar = renderScoreBar(result.score);
  const statusColor = getStatusColor(result.status);
  console.log(
    `TRUST SCORE: ${chalk.bold(`${result.score}/100`)} ${scoreBar} ${statusColor(result.status)}`
  );
  console.log();
  console.log(chalk.dim('━'.repeat(60)));
  console.log();

  // Permissions section (now always normalized as arrays)
  const hasBins = result.permissions.bins.length > 0;
  const hasEnv = result.permissions.env.length > 0;
  const hasTools = result.permissions.tools.length > 0;

  if (hasBins || hasEnv || hasTools) {
    console.log(chalk.bold('PERMISSIONS'));

    if (hasBins) {
      console.log(`  bins:  ${result.permissions.bins.join(', ')}`);
    }
    if (hasEnv) {
      console.log(`  env:   ${result.permissions.env.join(', ')}`);
    }
    if (hasTools) {
      console.log(`  tools: ${result.permissions.tools.join(', ')}`);
    }

    console.log();
  }

  // Findings section
  if (result.findings.length > 0) {
    console.log(chalk.bold('FINDINGS'));
    console.log();

    // Group by severity
    const critical = result.findings.filter(f => f.severity === 'CRITICAL');
    const high = result.findings.filter(f => f.severity === 'HIGH');
    const medium = result.findings.filter(f => f.severity === 'MEDIUM');
    const low = result.findings.filter(f => f.severity === 'LOW');
    const info = result.findings.filter(f => f.severity === 'INFO');

    const grouped = [
      ...critical,
      ...high,
      ...medium,
      ...low,
      ...info
    ];

    for (const finding of grouped) {
      renderFinding(finding);
    }

    console.log();
  } else {
    console.log(chalk.green('No security issues detected.'));
    console.log();
  }

  console.log(chalk.dim('━'.repeat(60)));
  console.log();

  // Recommendation
  const recommendationColor = result.status === 'PASS' ? chalk.green : chalk.yellow;
  console.log(
    chalk.bold('RECOMMENDATION: ') +
    recommendationColor(result.recommendation)
  );

  console.log();
}

/**
 * Report scan results as JSON
 */
export function reportAsJSON(result: ScanResult): void {
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Render a single finding
 */
function renderFinding(finding: Finding): void {
  const severityIcon = getSeverityIcon(finding.severity);
  const severityColor = getSeverityColor(finding.severity);

  // First line: severity and title
  console.log(
    `  ${severityIcon} ${severityColor(finding.severity.padEnd(8))} ${chalk.bold(finding.title)}`
  );

  // Location (file and line)
  if (finding.file) {
    const location = finding.line
      ? `${finding.file}:${finding.line}`
      : finding.file;
    console.log(`    ${chalk.dim(location)}`);
  }

  // Detail
  if (finding.detail) {
    console.log(`    ${finding.detail}`);
  }

  // Evidence
  if (finding.evidence) {
    console.log(`    ${chalk.dim(finding.evidence)}`);
  }

  console.log();
}

/**
 * Get icon for severity level
 */
function getSeverityIcon(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL':
      return chalk.red('✖');
    case 'HIGH':
      return chalk.red('✖');
    case 'MEDIUM':
      return chalk.yellow('⚠');
    case 'LOW':
      return chalk.dim('○');
    case 'INFO':
      return chalk.blue('ℹ');
  }
}

/**
 * Get color function for severity
 */
function getSeverityColor(severity: Severity): typeof chalk.red {
  switch (severity) {
    case 'CRITICAL':
      return chalk.red.bold;
    case 'HIGH':
      return chalk.red;
    case 'MEDIUM':
      return chalk.yellow;
    case 'LOW':
      return chalk.dim;
    case 'INFO':
      return chalk.blue;
  }
}

/**
 * Get color function for status
 */
function getStatusColor(status: Status): typeof chalk.red {
  switch (status) {
    case 'PASS':
      return chalk.green.bold;
    case 'WARN':
      return chalk.yellow.bold;
    case 'FAIL':
      return chalk.red.bold;
    case 'DANGER':
      return chalk.red.bold.bgRed;
    case 'ERROR':
      return chalk.red.bold;
  }
}

/**
 * Render score bar
 */
function renderScoreBar(score: number): string {
  const barLength = 10;
  const filled = Math.round((score / 100) * barLength);
  const empty = barLength - filled;

  let color: typeof chalk.red;
  if (score >= 80) color = chalk.green;
  else if (score >= 50) color = chalk.yellow;
  else color = chalk.red;

  return color('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}
