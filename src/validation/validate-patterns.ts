#!/usr/bin/env node

/**
 * CLI script to validate all AcidTest pattern files
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { validateAllPatterns } from './pattern-validator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patternsDir = path.join(__dirname, '../patterns');

console.log('Validating AcidTest pattern files...\n');

// Validate all patterns
const results = validateAllPatterns(patternsDir);

// Track statistics
let totalFiles = 0;
let validFiles = 0;
let totalPatterns = 0;
let hasErrors = false;

// Process and display results
for (const result of results) {
  totalFiles++;

  if (result.valid) {
    validFiles++;
    totalPatterns += result.patternCount || 0;
    const fileName = result.file ? path.basename(result.file) : 'unknown';
    console.log(`✓ ${fileName} (${result.patternCount || 0} pattern${result.patternCount !== 1 ? 's' : ''})`);
  } else {
    hasErrors = true;
    const fileName = result.file ? path.basename(result.file) : 'unknown';
    console.error(`✗ ${fileName}\n`);

    // Display all errors for this file
    for (const error of result.errors) {
      console.error(`  [Error] ${error.message}`);
      if (error.path && error.path !== fileName) {
        console.error(`  Path: ${error.path}`);
      }
      console.error('');
    }
  }
}

// Display summary
console.log(`${'─'.repeat(50)}`);
console.log('Validation Results:');
console.log(`  Files checked: ${totalFiles}`);
console.log(`  Valid files: ${validFiles}`);
console.log(`  Patterns validated: ${totalPatterns}`);

if (hasErrors) {
  console.log(`  Status: ✗ FAILED\n`);
  process.exit(1);
} else {
  console.log(`  Status: ✓ PASSED\n`);
  process.exit(0);
}
