#!/usr/bin/env node

/**
 * AcidTest CLI entry point
 * Parses arguments and routes to appropriate commands
 */

import { scanSkill, scanAllSkills } from './scanner.js';
import { reportToTerminal, reportAsJSON } from './reporter.js';

const VERSION = '0.1.2';

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);

  // Handle --version flag
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`acidtest v${VERSION}`);
    process.exit(0);
  }

  // Handle --help flag
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Parse command
  const command = args[0];

  if (command === 'scan') {
    await handleScan(args.slice(1));
  } else if (command === 'scan-all') {
    await handleScanAll(args.slice(1));
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Run "acidtest --help" for usage information.');
    process.exit(1);
  }
}

/**
 * Handle 'scan' command
 */
async function handleScan(args: string[]) {
  // Parse flags
  const jsonOutput = args.includes('--json');
  const paths = args.filter(arg => !arg.startsWith('--'));

  if (paths.length === 0) {
    console.error('Error: No skill path provided');
    console.error('Usage: acidtest scan <path-to-skill> [--json]');
    process.exit(1);
  }

  const skillPath = paths[0];

  try {
    const result = await scanSkill(skillPath);

    if (jsonOutput) {
      reportAsJSON(result);
    } else {
      reportToTerminal(result);
    }

    // Exit with non-zero code for FAIL or DANGER
    if (result.status === 'FAIL' || result.status === 'DANGER') {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error scanning skill:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Handle 'scan-all' command
 */
async function handleScanAll(args: string[]) {
  // Parse flags
  const jsonOutput = args.includes('--json');
  const paths = args.filter(arg => !arg.startsWith('--'));

  if (paths.length === 0) {
    console.error('Error: No directory path provided');
    console.error('Usage: acidtest scan-all <directory> [--json]');
    process.exit(1);
  }

  const directory = paths[0];

  try {
    const results = await scanAllSkills(directory);

    if (results.length === 0) {
      console.log('No skills found in directory');
      process.exit(0);
    }

    if (jsonOutput) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      // Print summary for each skill
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        reportToTerminal(result);

        // Add separator between skills (except for last one)
        if (i < results.length - 1) {
          console.log('\n' + '='.repeat(60) + '\n');
        }
      }

      // Print summary statistics
      console.log('\n' + '='.repeat(60));
      console.log(`\nScanned ${results.length} skill(s):\n`);

      const pass = results.filter(r => r.status === 'PASS').length;
      const warn = results.filter(r => r.status === 'WARN').length;
      const fail = results.filter(r => r.status === 'FAIL').length;
      const danger = results.filter(r => r.status === 'DANGER').length;

      if (pass > 0) console.log(`  PASS:   ${pass}`);
      if (warn > 0) console.log(`  WARN:   ${warn}`);
      if (fail > 0) console.log(`  FAIL:   ${fail}`);
      if (danger > 0) console.log(`  DANGER: ${danger}`);

      console.log();
    }

    // Exit with non-zero if any skill failed
    const hasFailures = results.some(
      r => r.status === 'FAIL' || r.status === 'DANGER'
    );

    if (hasFailures) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error scanning directory:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Print help text
 */
function printHelp() {
  console.log(`
AcidTest v${VERSION}
Security scanner for AI agent skills

USAGE:
  acidtest scan <path-to-skill> [--json]
  acidtest scan-all <directory> [--json]
  acidtest --version
  acidtest --help

COMMANDS:
  scan          Scan a single skill directory or SKILL.md file
  scan-all      Recursively scan all skills in a directory

OPTIONS:
  --json        Output results as JSON
  --version     Print version number
  --help        Show this help message

EXAMPLES:
  # Scan a single skill
  acidtest scan ./my-skill

  # Scan with JSON output
  acidtest scan ./my-skill --json

  # Scan all skills in a directory
  acidtest scan-all ./skills-directory

For more information, visit: https://acidtest.dev
`);
}

// Run CLI
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
