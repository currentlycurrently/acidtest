/**
 * Layer 3: Code Analysis
 * Performs AST analysis on JavaScript/TypeScript handler files
 */

import ts from 'typescript';
import type { Skill, Finding, LayerResult, CodeFile } from '../types.js';
import { loadPatterns } from '../pattern-loader.js';

/**
 * Scan code files for security issues
 */
export async function scanCode(skill: Skill): Promise<LayerResult> {
  const findings: Finding[] = [];

  // If no code files, nothing to scan
  if (skill.codeFiles.length === 0) {
    return {
      layer: 'code',
      findings
    };
  }

  // Load code-related patterns
  const dangerousImports = await loadPatterns('dangerous-imports');
  const pathPatterns = await loadPatterns('sensitive-paths');
  const exfiltrationPatterns = await loadPatterns('exfiltration-sinks');
  const obfuscationPatterns = await loadPatterns('obfuscation');
  const credentialPatterns = await loadPatterns('credential-patterns');

  // Combine all code-layer patterns
  const allPatterns = [
    ...dangerousImports,
    ...pathPatterns,
    ...exfiltrationPatterns,
    ...obfuscationPatterns,
    ...credentialPatterns
  ].filter(p => p.layer === 'code');

  // Scan each code file
  for (const codeFile of skill.codeFiles) {
    // Regex-based pattern scanning
    const regexFindings = scanCodeWithRegex(codeFile, allPatterns);
    findings.push(...regexFindings);

    // AST-based analysis
    const astFindings = scanCodeWithAST(codeFile);
    findings.push(...astFindings);
  }

  return {
    layer: 'code',
    findings
  };
}

/**
 * Scan code file using regex patterns
 */
function scanCodeWithRegex(codeFile: CodeFile, patterns: any[]): Finding[] {
  const findings: Finding[] = [];
  const content = codeFile.content;
  const relativePath = codeFile.path;

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.match.value, pattern.match.flags || '');
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      // Find line number for first match
      const lineNumber = findLineNumber(content, matches[0]);

      findings.push({
        severity: pattern.severity,
        category: pattern.category || 'code-issue',
        title: pattern.name,
        file: relativePath,
        line: lineNumber,
        detail: pattern.description || `Pattern match: ${pattern.name}`,
        evidence: `Found ${matches.length} occurrence(s)`,
        patternId: pattern.id
      });
    }
  }

  return findings;
}

/**
 * Scan code file using TypeScript AST
 */
function scanCodeWithAST(codeFile: CodeFile): Finding[] {
  const findings: Finding[] = [];
  const relativePath = codeFile.path;

  try {
    // Parse TypeScript/JavaScript
    const sourceFile = ts.createSourceFile(
      codeFile.path,
      codeFile.content,
      ts.ScriptTarget.Latest,
      true
    );

    // Extract all URLs from string literals
    const urls = extractURLs(sourceFile);
    if (urls.length > 0) {
      findings.push({
        severity: 'INFO',
        category: 'network-urls',
        title: 'URL literals found in code',
        file: relativePath,
        detail: `Found ${urls.length} URL(s) in code`,
        evidence: urls.slice(0, 5).join(', ') + (urls.length > 5 ? '...' : '')
      });
    }

    // Check for suspicious patterns
    const suspiciousFindings = detectSuspiciousPatterns(sourceFile, relativePath);
    findings.push(...suspiciousFindings);

    // Entropy-based obfuscation detection
    const entropyFindings = detectHighEntropyStrings(sourceFile, relativePath);
    findings.push(...entropyFindings);

  } catch (error) {
    // If parsing fails, the code might be malformed or obfuscated
    findings.push({
      severity: 'MEDIUM',
      category: 'parse-error',
      title: 'Failed to parse code file',
      file: relativePath,
      detail: 'Could not parse file as valid JavaScript/TypeScript',
      evidence: 'May indicate obfuscated or malformed code'
    });
  }

  return findings;
}

/**
 * Extract URL strings from source file
 */
function extractURLs(sourceFile: ts.SourceFile): string[] {
  const urls: string[] = [];
  const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text;
      if (urlPattern.test(text)) {
        urls.push(text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return urls;
}

/**
 * Detect suspicious patterns via AST traversal
 */
function detectSuspiciousPatterns(sourceFile: ts.SourceFile, filePath: string): Finding[] {
  const findings: Finding[] = [];
  const dynamicRequires: number[] = [];
  const evals: number[] = [];

  function visit(node: ts.Node) {
    // Check for eval() calls
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression) && expression.text === 'eval') {
        const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        evals.push(lineNumber);
      }

      // Check for require() with non-literal arguments
      if (ts.isIdentifier(expression) && expression.text === 'require') {
        if (node.arguments.length > 0) {
          const arg = node.arguments[0];
          if (!ts.isStringLiteral(arg) && !ts.isNoSubstitutionTemplateLiteral(arg)) {
            const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            dynamicRequires.push(lineNumber);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Add findings for dynamic requires
  if (dynamicRequires.length > 0) {
    findings.push({
      severity: 'HIGH',
      category: 'dynamic-require',
      title: 'Dynamic require() detected',
      file: filePath,
      line: dynamicRequires[0],
      detail: `Found ${dynamicRequires.length} dynamic require() call(s)`,
      evidence: 'Dynamic imports can load arbitrary modules'
    });
  }

  // Add findings for eval usage
  if (evals.length > 0) {
    findings.push({
      severity: 'CRITICAL',
      category: 'eval-usage',
      title: 'eval() usage detected',
      file: filePath,
      line: evals[0],
      detail: `Found ${evals.length} eval() call(s)`,
      evidence: 'eval() can execute arbitrary code'
    });
  }

  return findings;
}

/**
 * Calculate Shannon entropy of a string
 * Returns a value between 0 (no randomness) and ~8 (maximum randomness for byte strings)
 */
function calculateEntropy(str: string): number {
  if (str.length === 0) return 0;

  // Count character frequencies
  const freq = new Map<string, number>();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  // Calculate entropy using Shannon formula: -Σ(p * log2(p))
  let entropy = 0;
  const length = str.length;

  for (const count of freq.values()) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Detect high-entropy strings that may indicate obfuscation
 */
function detectHighEntropyStrings(sourceFile: ts.SourceFile, filePath: string): Finding[] {
  const findings: Finding[] = [];
  const ENTROPY_THRESHOLD = 4.5; // Strings above this are suspicious
  const MIN_LENGTH = 20; // Only check strings longer than this
  const highEntropyStrings: Array<{ text: string; entropy: number; line: number }> = [];

  function visit(node: ts.Node) {
    // Check string literals and template literals
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text;

      // Skip short strings and URLs (already detected elsewhere)
      if (text.length < MIN_LENGTH) {
        ts.forEachChild(node, visit);
        return;
      }

      // Skip URLs, they naturally have high entropy
      if (/^https?:\/\//.test(text)) {
        ts.forEachChild(node, visit);
        return;
      }

      const entropy = calculateEntropy(text);

      if (entropy > ENTROPY_THRESHOLD) {
        const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        highEntropyStrings.push({
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          entropy: Math.round(entropy * 100) / 100,
          line: lineNumber
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Only create a finding if we found high-entropy strings
  if (highEntropyStrings.length > 0) {
    const first = highEntropyStrings[0];
    findings.push({
      severity: 'MEDIUM',
      category: 'obfuscation',
      title: 'High-entropy strings detected',
      file: filePath,
      line: first.line,
      detail: `Found ${highEntropyStrings.length} string(s) with high entropy (>${ENTROPY_THRESHOLD})`,
      evidence: `Entropy: ${first.entropy}, Example: "${first.text}"`
    });
  }

  return findings;
}

/**
 * Find line number for a match in text
 */
function findLineNumber(text: string, match: string): number | undefined {
  const index = text.indexOf(match);
  if (index === -1) return undefined;

  const beforeMatch = text.substring(0, index);
  const lineNumber = beforeMatch.split('\n').length;

  return lineNumber;
}
