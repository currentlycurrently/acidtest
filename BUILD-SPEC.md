# AcidTest — Technical Specification

## Overview

AcidTest is an open-source CLI tool that scans AI agent skills (AgentSkills/SKILL.md format) for security vulnerabilities. It provides fast, local security analysis with zero configuration and no external dependencies.

**Key principles:**
- Zero network calls (runs entirely locally)
- Zero API keys (no external services)
- Zero configuration (works out of the box)
- Fast execution (< 2 seconds per skill)

## Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript with strict mode
- **Module System**: ESM (type: "module")
- **Dependencies**:
  - `gray-matter` — YAML frontmatter parsing
  - `typescript` — AST parsing via Compiler API
  - `chalk` — terminal colors
  - `glob` — file discovery

### Project Structure

```
src/
├── index.ts              # CLI entry point and argument parsing
├── scanner.ts            # Main orchestrator, coordinates all layers
├── pattern-loader.ts     # Loads patterns from JSON files
├── scoring.ts            # Trust score calculation
├── reporter.ts           # Terminal and JSON output formatting
├── types.ts              # TypeScript interfaces
├── layers/
│   ├── permissions.ts    # Layer 1: YAML frontmatter audit
│   ├── injection.ts      # Layer 2: Markdown prompt injection scan
│   ├── code.ts          # Layer 3: JS/TS AST analysis
│   └── crossref.ts      # Layer 4: Cross-reference analysis
└── patterns/            # Detection pattern definitions (JSON)
    ├── prompt-injection.json
    ├── dangerous-imports.json
    ├── sensitive-paths.json
    ├── exfiltration-sinks.json
    ├── obfuscation.json
    └── credential-patterns.json
```

### Build Process

TypeScript compiles to `dist/` using ESM output. Pattern JSON files are copied to `dist/patterns/` during build.

```bash
npm run build  # tsc && mkdir -p dist/patterns && cp src/patterns/*.json dist/patterns/
```

## Four-Layer Scanning System

### Layer 1: Permission Audit

**Location**: `src/layers/permissions.ts`

Analyzes YAML frontmatter in SKILL.md to identify declared capabilities:

- **`bins`** — System binaries (e.g., `curl`, `bash`)
- **`env`** — Environment variables (credentials, API keys)
- **`allowed-tools`** — Agent tools the skill can use

**Risk scoring**:
- Shell binaries (`bash`, `sh`, `powershell`) → CRITICAL
- Network tools (`curl`, `wget`) → HIGH
- Credential-shaped env vars (matching `KEY|TOKEN|SECRET|PASSWORD|AUTH`) → HIGH
- No declared permissions → LOW (suspicious but not malicious)

### Layer 2: Prompt Injection Scan

**Location**: `src/layers/injection.ts`

Scans markdown content for malicious patterns using regex from `prompt-injection.json` and `sensitive-paths.json`:

**Detection categories**:
- Instruction override ("ignore previous instructions", "act as root")
- Sensitive path references (`~/.ssh`, `~/.aws`, `/etc/passwd`)
- Obfuscation (base64 strings, zero-width Unicode characters)
- Excessively large documentation (> 50KB)

### Layer 3: Code Analysis

**Location**: `src/layers/code.ts`

Performs both regex and AST-based analysis on all `.ts`, `.js`, `.mjs`, `.cjs` files in the skill directory.

**Regex patterns** (from `dangerous-imports.json`, `exfiltration-sinks.json`, etc.):
- `child_process` imports → CRITICAL
- `eval()` usage → CRITICAL
- `fetch()` calls → MEDIUM
- Path traversal (`../`) → HIGH

**AST analysis** (TypeScript Compiler API):
- Extracts URL literals from string nodes
- Detects dynamic `require()` with non-literal arguments
- Identifies `eval()` calls
- Calculates average line length to detect minification

### Layer 4: Cross-Reference

**Location**: `src/layers/crossref.ts`

Compares findings across layers to detect permission mismatches and deception:

**Permission mismatches**:
- Code makes network calls but `allowed-tools` doesn't declare network access → CRITICAL
- Code uses `child_process` but no shell permission declared → CRITICAL
- Code accesses `process.env.X` but X not in frontmatter `env` → HIGH

**Deception indicators**:
- Benign description ("calculator") + network calls → HIGH
- Minified code (avg line length > 200 chars) → MEDIUM
- Large code size for simple functionality → MEDIUM

## Pattern System

### Pattern Schema

All patterns follow this JSON structure:

```json
{
  "id": "pi-001",
  "name": "instruction-override",
  "description": "Attempts to override agent instructions",
  "severity": "CRITICAL",
  "match": {
    "type": "regex",
    "value": "ignore\\s+(all\\s+)?(previous|prior|above)\\s+instructions",
    "flags": "i"
  },
  "layer": "markdown",
  "category": "prompt-injection"
}
```

### Pattern Loading

Patterns are loaded at runtime by `pattern-loader.ts`:
- Cached in memory after first load
- Filtered by layer when scanning
- Community-editable without code changes

## Scoring Algorithm

**Implementation**: `src/scoring.ts`

```typescript
score = 100
  - (CRITICAL_count × 25)
  - (HIGH_count × 15)
  - (MEDIUM_count × 8)
  - (LOW_count × 3)
  - (INFO_count × 0)
score = max(0, score)
```

**Status thresholds**:
- 80-100 → PASS (low risk)
- 50-79 → WARN (review recommended)
- 20-49 → FAIL (high risk)
- 0-19 → DANGER (likely malicious)

**Recommendation logic**:
- CRITICAL permission mismatch → "Do not install. Undeclared data exfiltration detected."
- CRITICAL prompt injection → "Do not install. Prompt injection attempt detected."
- Otherwise based on status

## CLI Interface

**Entry point**: `src/index.ts`

### Commands

```bash
acidtest scan <path>              # Scan single skill
acidtest scan-all <directory>     # Scan all skills recursively
acidtest --version                # Show version
acidtest --help                   # Show help
```

### Flags

- `--json` — Output JSON instead of colored terminal

### Exit codes

- `0` — PASS or WARN status
- `1` — FAIL, DANGER, or error

## Output Formats

### Terminal Output

**Implementation**: `reporter.ts` using Chalk

```
AcidTest v0.1.0

Scanning: skill-name
Source:   ./path/to/skill

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRUST SCORE: 72/100 ███████░░░ WARN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERMISSIONS
  tools: browser, shell

FINDINGS

  ✖ CRITICAL instruction-override
    SKILL.md:170
    Attempts to override agent instructions
    3 matches found

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDATION: Do not install. Prompt injection attempt detected.
```

**Color scheme**:
- CRITICAL/HIGH: red
- MEDIUM: yellow
- LOW: dim gray
- INFO: blue
- Score bar: green/yellow/red gradient

### JSON Output

```json
{
  "tool": "acidtest",
  "version": "0.1.0",
  "skill": {
    "name": "skill-name",
    "path": "./path/to/skill"
  },
  "score": 72,
  "status": "WARN",
  "permissions": {
    "bins": ["curl"],
    "env": ["API_KEY"],
    "tools": ["browser"]
  },
  "findings": [
    {
      "severity": "CRITICAL",
      "category": "prompt-injection",
      "title": "instruction-override",
      "file": "SKILL.md",
      "line": 170,
      "detail": "Attempts to override agent instructions",
      "evidence": "3 matches found",
      "patternId": "pi-001"
    }
  ],
  "recommendation": "Do not install. Prompt injection attempt detected."
}
```

## Skill Discovery

**Implementation**: `scanner.ts`

1. Accepts path to skill directory or SKILL.md file
2. Locates SKILL.md (required)
3. Parses frontmatter with `gray-matter`
4. Extracts markdown content
5. Discovers code files via `glob`:
   - `**/*.ts`
   - `**/*.js`
   - `**/*.mjs`
   - `**/*.cjs`
   - **Excludes**:
     - Build artifacts: `node_modules`, `dist`, `build`
     - Test files: `__tests__`, `tests`, `test`, `*.test.*`, `*.spec.*`
     - Development: `fixtures`, `examples`
     - Caches: `.git`, `.cache`, `.next`, `.nuxt`, `.vite*`

## Type System

**Location**: `src/types.ts`

Key interfaces:

```typescript
interface Pattern {
  id: string;
  name: string;
  severity: Severity;
  match: PatternMatch;
  layer: Layer;
  category?: string;
}

interface Finding {
  severity: Severity;
  category: string;
  title: string;
  file?: string;
  line?: number;
  detail: string;
  evidence?: string;
  patternId?: string;
}

interface ScanResult {
  tool: string;
  version: string;
  skill: { name: string; path: string };
  score: number;
  status: Status;
  permissions: {
    bins: string[];    // Always array, empty if not declared
    env: string[];     // Always array, empty if not declared
    tools: string[];   // Always array, empty if not declared
  };
  findings: Finding[];
  recommendation: string;
}
```

## Extending Patterns

To add a new detection pattern:

1. Choose appropriate category file in `src/patterns/`
2. Add pattern object with unique ID
3. Specify severity (CRITICAL/HIGH/MEDIUM/LOW/INFO)
4. Define regex match with appropriate layer
5. Rebuild to copy updated JSON to `dist/`

No code changes required for new patterns.

## Performance Characteristics

- Single skill scan: < 2 seconds
- Batch scan (20+ skills): < 30 seconds
- Memory usage: < 100MB
- Zero network I/O
- Disk I/O limited to reading skill files

## Limitations

- Only scans JavaScript/TypeScript (not Python/Bash handlers)
- AST parsing may fail on heavily obfuscated code (flagged as suspicious)
- Regex patterns can have false positives
- Does not execute code (static analysis only)
- Does not resolve npm dependencies
