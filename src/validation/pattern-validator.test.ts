/**
 * Tests for pattern validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { validatePattern, validateAllPatterns } from './pattern-validator.js';
import type { PatternCategory } from '../types.js';

describe('Pattern Validator', () => {
  const testDir = join(process.cwd(), 'test-validation-temp');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should validate a valid pattern file', () => {
    const validPattern: PatternCategory = {
      category: 'test-patterns',
      patterns: [
        {
          id: 'tp-001',
          name: 'test-pattern',
          description: 'A test pattern',
          severity: 'HIGH',
          match: {
            type: 'regex',
            value: 'test.*pattern',
            flags: 'i'
          },
          layer: 'markdown'
        }
      ]
    };

    const filePath = join(testDir, 'valid-pattern.json');
    writeFileSync(filePath, JSON.stringify(validPattern, null, 2));

    const result = validatePattern(filePath);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.patternCount).toBe(1);
  });

  it('should fail validation when required field is missing (name)', () => {
    const invalidPattern = {
      category: 'test-patterns',
      patterns: [
        {
          id: 'tp-001',
          // name is missing
          severity: 'HIGH',
          match: {
            type: 'regex',
            value: 'test.*pattern'
          },
          layer: 'markdown'
        }
      ]
    };

    const filePath = join(testDir, 'missing-name.json');
    writeFileSync(filePath, JSON.stringify(invalidPattern, null, 2));

    const result = validatePattern(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toMatch(/name/i);
  });

  it('should fail validation with invalid severity enum', () => {
    const invalidPattern = {
      category: 'test-patterns',
      patterns: [
        {
          id: 'tp-001',
          name: 'test-pattern',
          severity: 'INVALID_SEVERITY', // Invalid severity
          match: {
            type: 'regex',
            value: 'test.*pattern'
          },
          layer: 'markdown'
        }
      ]
    };

    const filePath = join(testDir, 'invalid-severity.json');
    writeFileSync(filePath, JSON.stringify(invalidPattern, null, 2));

    const result = validatePattern(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toMatch(/(severity|enum)/i);
  });

  it('should fail validation with invalid match type', () => {
    const invalidPattern = {
      category: 'test-patterns',
      patterns: [
        {
          id: 'tp-001',
          name: 'test-pattern',
          severity: 'HIGH',
          match: {
            type: 'invalid-type', // Invalid match type
            value: 'test.*pattern'
          },
          layer: 'markdown'
        }
      ]
    };

    const filePath = join(testDir, 'invalid-match-type.json');
    writeFileSync(filePath, JSON.stringify(invalidPattern, null, 2));

    const result = validatePattern(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toMatch(/(match|type|enum)/i);
  });

  it('should validate all current pattern files in src/patterns/', () => {
    const patternsDir = join(process.cwd(), 'src', 'patterns');
    const results = validateAllPatterns(patternsDir);

    // All pattern files should be valid
    const allValid = results.every((result) => result.valid);
    expect(allValid).toBe(true);

    // Should have validated at least 6 files (based on current patterns)
    expect(results.length).toBeGreaterThanOrEqual(6);

    // Display any errors for debugging
    const errors = results.filter((r) => !r.valid);
    if (errors.length > 0) {
      console.error('Pattern validation errors:');
      errors.forEach((error) => {
        console.error(`  File: ${error.file}`);
        error.errors.forEach((e) => {
          console.error(`    - ${e.message}`);
        });
      });
    }
  });

  it('should detect duplicate pattern IDs in the same file', () => {
    const duplicatePattern = {
      category: 'test-patterns',
      patterns: [
        {
          id: 'tp-001',
          name: 'first-pattern',
          severity: 'HIGH',
          match: {
            type: 'regex',
            value: 'test1'
          },
          layer: 'markdown'
        },
        {
          id: 'tp-001', // Duplicate ID
          name: 'second-pattern',
          severity: 'HIGH',
          match: {
            type: 'regex',
            value: 'test2'
          },
          layer: 'markdown'
        }
      ]
    };

    const filePath = join(testDir, 'duplicate-ids.json');
    writeFileSync(filePath, JSON.stringify(duplicatePattern, null, 2));

    const result = validatePattern(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toMatch(/duplicate/i);
  });

  it('should detect invalid regex patterns', () => {
    const invalidRegexPattern = {
      category: 'test-patterns',
      patterns: [
        {
          id: 'tp-001',
          name: 'invalid-regex',
          severity: 'HIGH',
          match: {
            type: 'regex',
            value: '[invalid(regex' // Invalid regex
          },
          layer: 'markdown'
        }
      ]
    };

    const filePath = join(testDir, 'invalid-regex.json');
    writeFileSync(filePath, JSON.stringify(invalidRegexPattern, null, 2));

    const result = validatePattern(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toMatch(/regex/i);
  });

  it('should validate remediation structure when present', () => {
    const patternWithRemediation: PatternCategory = {
      category: 'test-patterns',
      patterns: [
        {
          id: 'tp-001',
          name: 'test-pattern',
          severity: 'HIGH',
          match: {
            type: 'regex',
            value: 'test'
          },
          layer: 'code',
          remediation: {
            title: 'Fix this issue',
            suggestions: [
              'Do this',
              'Then do that'
            ],
            autofix: true,
            fixAction: {
              type: 'replace',
              pattern: 'old',
              replacement: 'new'
            }
          }
        }
      ]
    };

    const filePath = join(testDir, 'with-remediation.json');
    writeFileSync(filePath, JSON.stringify(patternWithRemediation, null, 2));

    const result = validatePattern(filePath);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
