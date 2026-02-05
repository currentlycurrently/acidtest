/**
 * Main scanner orchestrator
 * Coordinates all four scanning layers
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import type { Skill, CodeFile, ScanResult, Finding } from './types.js';
import { scanPermissions } from './layers/permissions.js';
import { scanInjection } from './layers/injection.js';
import { scanCode } from './layers/code.js';
import { scanCrossReference } from './layers/crossref.js';
import { calculateScore, determineStatus, generateRecommendation } from './scoring.js';

const VERSION = '0.1.0';

/**
 * Main scan function
 * Scans a skill directory or SKILL.md file
 */
export async function scanSkill(skillPath: string): Promise<ScanResult> {
  // Load the skill
  const skill = await loadSkill(skillPath);

  // Run all four scanning layers
  const layer1 = await scanPermissions(skill);
  const layer2 = await scanInjection(skill);
  const layer3 = await scanCode(skill);

  // Combine findings from layers 1-3 for cross-reference
  const previousFindings = [
    ...layer1.findings,
    ...layer2.findings,
    ...layer3.findings
  ];

  const layer4 = await scanCrossReference(skill, previousFindings);

  // Combine all findings
  const allFindings: Finding[] = [
    ...layer1.findings,
    ...layer2.findings,
    ...layer3.findings,
    ...layer4.findings
  ];

  // Calculate score and status
  const score = calculateScore(allFindings);
  const status = determineStatus(score);
  const recommendation = generateRecommendation(status, allFindings);

  // Build result
  const result: ScanResult = {
    tool: 'acidtest',
    version: VERSION,
    skill: {
      name: skill.name,
      path: skill.path
    },
    score,
    status,
    permissions: {
      bins: skill.metadata.bins,
      env: skill.metadata.env,
      tools: skill.metadata['allowed-tools']
    },
    findings: allFindings,
    recommendation
  };

  return result;
}

/**
 * Load a skill from a directory or SKILL.md file
 */
async function loadSkill(skillPath: string): Promise<Skill> {
  let skillMdPath: string;
  let skillDir: string;

  // Determine if path is a directory or file
  if (existsSync(skillPath) && statSync(skillPath).isDirectory()) {
    skillDir = skillPath;
    skillMdPath = join(skillPath, 'SKILL.md');
  } else if (basename(skillPath) === 'SKILL.md') {
    skillMdPath = skillPath;
    skillDir = join(skillPath, '..');
  } else {
    throw new Error('Path must be a skill directory or SKILL.md file');
  }

  // Check if SKILL.md exists
  if (!existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found at: ${skillMdPath}`);
  }

  // Read and parse SKILL.md
  const skillContent = readFileSync(skillMdPath, 'utf-8');
  const parsed = matter(skillContent);

  // Extract metadata and markdown
  const metadata = parsed.data;
  const markdownContent = parsed.content;

  // Determine skill name
  const skillName =
    metadata.name ||
    basename(skillDir) ||
    'unknown-skill';

  // Find all code files (.ts, .js, .mjs, .cjs)
  const codeFiles = await findCodeFiles(skillDir);

  return {
    name: skillName,
    path: skillPath,
    metadata,
    markdownContent,
    codeFiles
  };
}

/**
 * Find all code files in skill directory
 */
async function findCodeFiles(skillDir: string): Promise<CodeFile[]> {
  const codeFiles: CodeFile[] = [];

  // Search for .ts, .js, .mjs, .cjs files
  const patterns = [
    join(skillDir, '**/*.ts'),
    join(skillDir, '**/*.js'),
    join(skillDir, '**/*.mjs'),
    join(skillDir, '**/*.cjs')
  ];

  for (const pattern of patterns) {
    try {
      const files = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
      });

      for (const filePath of files) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          const ext = extname(filePath).slice(1); // Remove leading dot

          // Determine extension type
          let extension: 'ts' | 'js' | 'mjs' | 'cjs';
          if (ext === 'ts') extension = 'ts';
          else if (ext === 'mjs') extension = 'mjs';
          else if (ext === 'cjs') extension = 'cjs';
          else extension = 'js';

          codeFiles.push({
            path: filePath,
            content,
            extension
          });
        } catch (error) {
          // Skip files that can't be read
          console.warn(`Warning: Could not read file: ${filePath}`);
        }
      }
    } catch (error) {
      // Skip pattern if glob fails
    }
  }

  return codeFiles;
}

/**
 * Scan multiple skills in a directory
 */
export async function scanAllSkills(directory: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  // Find all SKILL.md files
  const pattern = join(directory, '**/SKILL.md');
  const skillFiles = await glob(pattern, {
    ignore: ['**/node_modules/**']
  });

  for (const skillFile of skillFiles) {
    try {
      const result = await scanSkill(skillFile);
      results.push(result);
    } catch (error) {
      console.warn(`Warning: Could not scan skill at ${skillFile}:`, (error as Error).message);
    }
  }

  return results;
}
