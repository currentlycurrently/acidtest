/**
 * Pattern loader utility
 * Loads detection patterns from JSON files
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Pattern, PatternCategory } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const patternCache = new Map<string, Pattern[]>();

/**
 * Load patterns from a specific category file
 */
export async function loadPatterns(category: string): Promise<Pattern[]> {
  // Check cache first
  if (patternCache.has(category)) {
    return patternCache.get(category)!;
  }

  try {
    const patternPath = join(__dirname, 'patterns', `${category}.json`);
    const content = readFileSync(patternPath, 'utf-8');
    const data: PatternCategory = JSON.parse(content);

    patternCache.set(category, data.patterns);
    return data.patterns;
  } catch (error) {
    console.warn(`Warning: Could not load patterns for category: ${category}`);
    return [];
  }
}

/**
 * Load all available patterns
 */
export async function loadAllPatterns(): Promise<Pattern[]> {
  const categories = [
    'prompt-injection',
    'dangerous-imports',
    'sensitive-paths',
    'exfiltration-sinks',
    'obfuscation',
    'credential-patterns'
  ];

  const allPatterns: Pattern[] = [];

  for (const category of categories) {
    const patterns = await loadPatterns(category);
    allPatterns.push(...patterns);
  }

  return allPatterns;
}
