/**
 * Tests for remediation functionality
 */

import { describe, it, expect } from 'vitest';
import { scanSkill } from './scanner.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Remediation', () => {
  const testDir = join(process.cwd(), 'test-remediation-temp');

  it('should include remediation suggestions for patterns that have them', async () => {
    // Create a temporary test directory
    mkdirSync(testDir, { recursive: true });

    try {
      // Create a SKILL.md file
      writeFileSync(
        join(testDir, 'SKILL.md'),
        `---
name: test-skill-with-eval
---

# Test Skill with eval

This is a test skill that uses eval.
`
      );

      // Create a handler file with eval usage (which has remediation)
      writeFileSync(
        join(testDir, 'handler.ts'),
        `export function handler(input: string) {
  const result = eval(input);
  return result;
}
`
      );

      // Scan the skill
      const result = await scanSkill(testDir);

      // Find the eval-usage finding
      const evalFinding = result.findings.find(f => f.title === 'eval-usage');

      expect(evalFinding).toBeDefined();
      expect(evalFinding?.remediation).toBeDefined();
      expect(evalFinding?.remediation?.title).toBe('Replace eval() with safer alternatives');
      expect(evalFinding?.remediation?.suggestions).toBeInstanceOf(Array);
      expect(evalFinding?.remediation?.suggestions.length).toBeGreaterThan(0);
    } finally {
      // Clean up
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should not crash for findings without remediation', async () => {
    // Create a temporary test directory
    mkdirSync(testDir, { recursive: true });

    try {
      // Create a SKILL.md file
      writeFileSync(
        join(testDir, 'SKILL.md'),
        `---
name: test-skill-plain
---

# Plain Test Skill

This is a test skill.
`
      );

      // Create a simple handler file without security issues
      writeFileSync(
        join(testDir, 'handler.ts'),
        `export function handler() {
  return 'hello';
}
`
      );

      // Scan the skill
      const result = await scanSkill(testDir);

      // Should complete without errors
      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
    } finally {
      // Clean up
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});
