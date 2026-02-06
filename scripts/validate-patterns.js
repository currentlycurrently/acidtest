#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patternsDir = path.join(__dirname, '..', 'src', 'patterns');

const VALID_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const VALID_LAYERS = ['permissions', 'markdown', 'code', 'crossref'];
const REQUIRED_PATTERN_FIELDS = ['id', 'name', 'severity', 'match', 'layer'];

let hasErrors = false;
let validatedCount = 0;
let patternCount = 0;

console.log('Validating AcidTest pattern files...\n');

// Get all pattern JSON files
const patternFiles = globSync('*.json', { cwd: patternsDir }).sort();

if (patternFiles.length === 0) {
  console.error('ERROR: No pattern files found in', patternsDir);
  process.exit(1);
}

console.log(`Found ${patternFiles.length} pattern file(s):\n`);

// Validate each file
for (const file of patternFiles) {
  const filePath = path.join(patternsDir, file);
  let fileErrors = 0;

  try {
    // Step 1: Parse JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (e) {
      console.error(`✗ ${file}`);
      console.error(`  [JSON Parse Error] ${e.message}\n`);
      hasErrors = true;
      fileErrors++;
      continue;
    }

    // Step 2: Validate top-level structure
    if (!data.category || typeof data.category !== 'string') {
      console.error(`✗ ${file}`);
      console.error(`  [Schema Error] Missing or invalid "category" field\n`);
      hasErrors = true;
      fileErrors++;
      continue;
    }

    if (!Array.isArray(data.patterns)) {
      console.error(`✗ ${file}`);
      console.error(`  [Schema Error] "patterns" must be an array\n`);
      hasErrors = true;
      fileErrors++;
      continue;
    }

    if (data.patterns.length === 0) {
      console.error(`✗ ${file}`);
      console.error(`  [Schema Error] "patterns" array is empty\n`);
      hasErrors = true;
      fileErrors++;
      continue;
    }

    // Step 3: Validate each pattern
    let patternFileErrors = 0;
    const seenIds = new Set();

    for (let i = 0; i < data.patterns.length; i++) {
      const pattern = data.patterns[i];
      const patternIndex = i + 1;

      // Check required fields
      const missingFields = REQUIRED_PATTERN_FIELDS.filter(
        field => !(field in pattern)
      );

      if (missingFields.length > 0) {
        console.error(`✗ ${file} [Pattern ${patternIndex}]`);
        console.error(`  [Missing Fields] ${missingFields.join(', ')}\n`);
        patternFileErrors++;
        continue;
      }

      // Check for duplicate IDs
      if (seenIds.has(pattern.id)) {
        console.error(`✗ ${file} [Pattern ${patternIndex}]`);
        console.error(`  [Duplicate ID] ID "${pattern.id}" already used in this file\n`);
        patternFileErrors++;
        continue;
      }
      seenIds.add(pattern.id);

      // Validate ID format (should be something like "pi-001")
      if (!/^[a-z]{2,}-\d{3,}$/i.test(pattern.id)) {
        console.warn(`⚠ ${file} [Pattern ${patternIndex}]`);
        console.warn(`  [ID Format] "${pattern.id}" doesn't match expected format (e.g., "pi-001")\n`);
      }

      // Validate severity
      if (!VALID_SEVERITIES.includes(pattern.severity)) {
        console.error(`✗ ${file} [Pattern ${patternIndex}]`);
        console.error(
          `  [Invalid Severity] "${pattern.severity}" is not valid. Must be one of: ${VALID_SEVERITIES.join(', ')}\n`
        );
        patternFileErrors++;
        continue;
      }

      // Validate layer
      if (!VALID_LAYERS.includes(pattern.layer)) {
        console.error(`✗ ${file} [Pattern ${patternIndex}]`);
        console.error(
          `  [Invalid Layer] "${pattern.layer}" is not valid. Must be one of: ${VALID_LAYERS.join(', ')}\n`
        );
        patternFileErrors++;
        continue;
      }

      // Validate match object
      if (!pattern.match || typeof pattern.match !== 'object') {
        console.error(`✗ ${file} [Pattern ${patternIndex}]`);
        console.error(`  [Invalid Match] "match" must be an object\n`);
        patternFileErrors++;
        continue;
      }

      if (pattern.match.type === 'regex') {
        // Validate regex pattern
        if (!pattern.match.value || typeof pattern.match.value !== 'string') {
          console.error(`✗ ${file} [Pattern ${patternIndex}]`);
          console.error(`  [Invalid Regex] "match.value" must be a non-empty string\n`);
          patternFileErrors++;
          continue;
        }

        try {
          // Try to compile the regex
          const flags = pattern.match.flags || '';
          new RegExp(pattern.match.value, flags);
        } catch (e) {
          console.error(`✗ ${file} [Pattern ${patternIndex}]`);
          console.error(`  [Regex Compilation Error] ${e.message}`);
          console.error(`  Pattern: ${pattern.match.value}\n`);
          patternFileErrors++;
          continue;
        }
      } else if (pattern.match.type !== 'ast') {
        console.warn(`⚠ ${file} [Pattern ${patternIndex}]`);
        console.warn(`  [Unknown Match Type] "${pattern.match.type}" is not a standard type (regex or ast)\n`);
      }

      patternCount++;
    }

    if (patternFileErrors === 0) {
      console.log(`✓ ${file} (${data.patterns.length} pattern${data.patterns.length !== 1 ? 's' : ''})`);
      validatedCount += data.patterns.length;
    } else {
      fileErrors += patternFileErrors;
      hasErrors = true;
    }
  } catch (e) {
    console.error(`✗ ${file}`);
    console.error(`  [Unexpected Error] ${e.message}\n`);
    hasErrors = true;
    fileErrors++;
  }
}

// Summary
console.log(
  `\n${'─'.repeat(50)}`
);
console.log(`Validation Results:`);
console.log(`  Files checked: ${patternFiles.length}`);
console.log(`  Patterns validated: ${validatedCount}`);

if (hasErrors) {
  console.log(`  Status: ✗ FAILED\n`);
  process.exit(1);
} else {
  console.log(`  Status: ✓ PASSED\n`);
  process.exit(0);
}
