/**
 * Core TypeScript interfaces for AcidTest security scanner
 */

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type Status = 'PASS' | 'WARN' | 'FAIL' | 'DANGER';

export type Layer = 'permissions' | 'markdown' | 'code' | 'crossref';

export type PatternMatchType = 'regex' | 'ast' | 'exact';

/**
 * Pattern match configuration
 */
export interface PatternMatch {
  type: PatternMatchType;
  value: string;
  flags?: string;
}

/**
 * Detection pattern definition
 */
export interface Pattern {
  id: string;
  name: string;
  description?: string;
  severity: Severity;
  match: PatternMatch;
  layer: Layer;
  category?: string;
}

/**
 * Pattern category file structure
 */
export interface PatternCategory {
  category: string;
  patterns: Pattern[];
}

/**
 * Skill metadata from YAML frontmatter
 */
export interface SkillMetadata {
  name?: string;
  description?: string;
  version?: string;
  env?: string[];
  bins?: string[];
  'allowed-tools'?: string[];
  [key: string]: unknown;
}

/**
 * Parsed skill structure
 */
export interface Skill {
  name: string;
  path: string;
  metadata: SkillMetadata;
  markdownContent: string;
  codeFiles: CodeFile[];
}

/**
 * Code file structure
 */
export interface CodeFile {
  path: string;
  content: string;
  extension: 'ts' | 'js' | 'mjs' | 'cjs';
}

/**
 * Individual security finding
 */
export interface Finding {
  severity: Severity;
  category: string;
  title: string;
  file?: string;
  line?: number;
  detail: string;
  evidence?: string;
  patternId?: string;
}

/**
 * Layer scan result
 */
export interface LayerResult {
  layer: Layer;
  findings: Finding[];
}

/**
 * Complete scan result
 */
export interface ScanResult {
  tool: string;
  version: string;
  skill: {
    name: string;
    path: string;
  };
  score: number;
  status: Status;
  permissions: {
    bins: string[];
    env: string[];
    tools: string[];
  };
  findings: Finding[];
  recommendation: string;
}

/**
 * CLI options
 */
export interface CliOptions {
  json?: boolean;
  verbose?: boolean;
}
