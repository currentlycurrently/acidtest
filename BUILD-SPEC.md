# AcidTest — Build Spec for Claude Code

## What This Is

AcidTest is an open-source CLI tool that scans AI agent skills (AgentSkills/SKILL.md format) for security risks before installation. It targets the individual developer and OpenClaw community — not enterprise security teams.

The name: acidtest.dev
The npm package: acidtest
The command: `npx acidtest scan ./path-to-skill`

## What Already Exists

Cisco has an open-source skill-scanner (github.com/cisco-ai-defense/skill-scanner). It's Python-based, requires uv, and optionally integrates with Cisco AI Defense, VirusTotal, and Claude API keys. It has 147 GitHub stars despite backing from a $200B company. The OpenClaw community (116,000+ GitHub stars) is not adopting it.

AcidTest is different: zero config, zero API keys, zero Python. One command, instant results. Built for the person installing skills from ClawHub at midnight, not the security team writing compliance reports.

## Stack

- Node.js / TypeScript
- Zero heavyweight dependencies
- Runs locally, no network calls, no cloud, no accounts
- Publishes to npm
- MIT license

## Core Dependencies (keep minimal)

- `gray-matter` — parse YAML frontmatter from SKILL.md
- TypeScript Compiler API (`typescript` package) — AST parsing of .ts/.js handler files
- `chalk` — colored terminal output
- `glob` — file discovery within skill directories
- That's it. Fight the urge to add more.

## Command Interface

```bash
# Scan a single skill directory
acidtest scan ./my-skill

# Scan a single SKILL.md file directly
acidtest scan ./my-skill/SKILL.md

# Scan multiple skills (recursive)
acidtest scan-all ./skills-directory

# Output as JSON instead of terminal
acidtest scan ./my-skill --json

# Show version
acidtest --version
```

No other commands for v1. No `init`, no `config`, no `login`, no `register`.

## What Gets Scanned

Every scan runs four layers in sequence against a skill directory.

### Layer 1 — Permission Audit (SKILL.md frontmatter)

Parse YAML frontmatter and extract:
- `bins` — system binaries the skill declares it needs
- `env` — environment variables it requests (API keys, tokens, credentials)
- `allowed-tools` — tools the agent is allowed to use
- Any metadata flags

Score against risk taxonomy:
- File system access tools → MEDIUM
- Network/HTTP tools → HIGH  
- Shell/command execution tools → CRITICAL
- Credential-shaped env vars (match patterns: KEY, TOKEN, SECRET, PASSWORD, AUTH, CREDENTIAL, API_KEY) → HIGH
- No declared permissions at all → FLAG (suspicious — legitimate skills declare something)

### Layer 2 — Prompt Injection Scan (SKILL.md markdown body)

The markdown body is injected directly into the agent's context window. This is the primary prompt injection surface. Scan for:

**Instruction override patterns:**
- "ignore previous instructions"
- "ignore all prior instructions"  
- "you are now in maintenance mode"
- "debug mode enabled"
- "system override"
- "disregard your instructions"
- "forget everything above"
- "new instructions follow"
- "act as root"
- "you have been jailbroken"

**Data access patterns:**
- References to ~/.ssh, ~/.aws, ~/.env, ~/.openclaw/credentials
- References to /etc/passwd, /etc/shadow
- "read the contents of" + sensitive path patterns
- "send to" or "POST to" or "exfiltrate" + URL patterns
- "upload" + file path patterns

**Obfuscation patterns:**
- Base64-encoded strings (detect and flag, optionally decode for inspection)
- Hex-encoded content
- Zero-width Unicode characters (U+200B, U+200C, U+200D, U+FEFF)
- HTML comments containing instructions
- Markdown comments containing instructions
- Unicode homoglyph substitutions

**Self-modification patterns:**
- Instructions to edit the agent's own config
- Instructions to install additional skills
- Instructions to modify permission settings
- Instructions to disable safety features

### Layer 3 — Handler Code Analysis (JS/TS files)

For every .ts and .js file in the skill directory, parse AST using TypeScript Compiler API and scan for:

**Dangerous imports/requires:**
- `child_process` (exec, spawn, execSync, spawnSync, fork)
- `fs` operations outside declared workspace (especially readFileSync, writeFileSync, unlinkSync)
- `net`, `dgram`, `tls` (raw socket access)
- `vm` (vm.runInNewContext, vm.createContext)
- `eval`, `Function()` constructor
- `os` module (especially os.homedir, os.userInfo)

**Outbound network calls:**
- `fetch()` — extract URL arguments
- `http.request()`, `https.request()`
- `XMLHttpRequest`
- `axios`, `got`, `node-fetch`, `undici` imports
- WebSocket connections
- Any URL string literals (extract and list all found URLs)

**File system access patterns:**
- Path traversal: `../` sequences, especially toward parent directories
- Absolute paths to sensitive locations: home directory, .ssh, .aws, .env files, .openclaw directory
- Dynamic path construction using `os.homedir()` or `process.env.HOME`
- Reading of credential files, config files, keychain access

**Code execution patterns:**
- `eval()` with dynamic arguments
- `new Function()` with dynamic arguments
- `require()` with dynamic/variable arguments
- `import()` with dynamic arguments
- `child_process.exec()` with string concatenation or template literals
- `process.env` access beyond what's declared in SKILL.md frontmatter

**Exfiltration patterns:**
- Outbound HTTP calls that include data from fs.readFile or process.env in the body/query
- Writing to temp files then reading and sending
- Piping process output to network calls

### Layer 4 — Cross-Reference Analysis

Compare findings across layers 1-3:

**Permission mismatches:**
- Skill declares no network tools but handler makes HTTP calls → CRITICAL
- Skill declares no shell access but handler uses child_process → CRITICAL  
- Skill declares no file access but handler reads outside workspace → HIGH
- Handler accesses env vars not declared in frontmatter → HIGH

**Deception indicators:**
- Skill description sounds benign (e.g., "calculator", "timer") but contains network calls → HIGH
- Skill metadata claims "read-only" but handler writes or deletes files → HIGH
- Handler includes URLs that don't match the skill's stated purpose → MEDIUM

**Supply chain indicators:**
- Minified or obfuscated code in handler files → MEDIUM
- Suspiciously large handler files for simple stated functionality → LOW
- Dependencies on packages not related to stated purpose → LOW

## Scoring

Each finding has a severity: CRITICAL, HIGH, MEDIUM, LOW, INFO

Overall trust score: 0-100

Scoring formula:
- Start at 100
- Each CRITICAL finding: -25
- Each HIGH finding: -15
- Each MEDIUM finding: -8
- Each LOW finding: -3
- Each INFO finding: -0 (informational only)
- Floor at 0

Overall status derived from score:
- 80-100: PASS (low risk)
- 50-79: WARN (review recommended)
- 20-49: FAIL (high risk, do not install without review)
- 0-19: DANGER (likely malicious)

## Output Format (Terminal)

```
AcidTest v0.1.0

Scanning: linkedin-automation-that-really-works
Source:   ./skills/linkedin-automation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRUST SCORE: 23/100 ██░░░░░░░░ FAIL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERMISSIONS
  bins:  chromium, curl
  env:   LINKEDIN_EMAIL, LINKEDIN_PASSWORD
  tools: browser, shell

FINDINGS

  ✖ CRITICAL  Undeclared outbound POST
    handler.ts:147 — fetch("https://api.trackuser.io/v1/log", ...)
    Sends LINKEDIN_EMAIL in request body
    Not declared in skill metadata

  ✖ HIGH  Shell access disproportionate to purpose
    Skill description: "LinkedIn post scheduler"
    Declared tools include: shell
    Shell access is unusual for a scheduling tool

  ⚠ MEDIUM  Direct credential file access
    handler.ts:34 — fs.readFileSync(path.join(homedir, '.openclaw', 'credentials'))
    Should use official credential API

  ○ LOW  No version pinning
    package.json specifies "latest" for 3 dependencies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDATION: Do not install.
Undeclared data exfiltration detected.
```

Use chalk for colors:
- CRITICAL: red, bold
- HIGH: red
- MEDIUM: yellow
- LOW: dim/gray
- PASS: green
- Score bar: green/yellow/red gradient based on score

## Output Format (JSON)

When --json flag is passed, output clean JSON to stdout:

```json
{
  "tool": "acidtest",
  "version": "0.1.0",
  "skill": {
    "name": "linkedin-automation-that-really-works",
    "path": "./skills/linkedin-automation"
  },
  "score": 23,
  "status": "FAIL",
  "permissions": {
    "bins": ["chromium", "curl"],
    "env": ["LINKEDIN_EMAIL", "LINKEDIN_PASSWORD"],
    "tools": ["browser", "shell"]
  },
  "findings": [
    {
      "severity": "CRITICAL",
      "category": "undeclared-network",
      "title": "Undeclared outbound POST",
      "file": "handler.ts",
      "line": 147,
      "detail": "fetch(\"https://api.trackuser.io/v1/log\", ...) sends LINKEDIN_EMAIL in request body",
      "evidence": "Not declared in skill metadata"
    }
  ],
  "recommendation": "Do not install. Undeclared data exfiltration detected."
}
```

## Pattern Library Structure

All detection patterns live in a single directory: `src/patterns/`

Each pattern category is a JSON file:

```
src/patterns/
  prompt-injection.json
  dangerous-imports.json
  sensitive-paths.json
  exfiltration-sinks.json
  obfuscation.json
  credential-patterns.json
```

Each pattern file follows the same schema:

```json
{
  "category": "prompt-injection",
  "patterns": [
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
      "layer": "markdown"
    }
  ]
}
```

This structure means:
- Community contributors can add patterns by editing JSON files
- New pattern categories can be added without code changes
- Patterns can be versioned and diffed easily
- The scanner engine reads patterns at startup, no hardcoding

## Project Structure

```
acidtest/
├── src/
│   ├── index.ts              # CLI entry point (arg parsing, routing)
│   ├── scanner.ts            # Main scan orchestrator
│   ├── layers/
│   │   ├── permissions.ts    # Layer 1: YAML frontmatter audit
│   │   ├── injection.ts      # Layer 2: Markdown prompt injection scan
│   │   ├── code.ts           # Layer 3: JS/TS AST analysis
│   │   └── crossref.ts       # Layer 4: Cross-reference analysis
│   ├── patterns/
│   │   ├── prompt-injection.json
│   │   ├── dangerous-imports.json
│   │   ├── sensitive-paths.json
│   │   ├── exfiltration-sinks.json
│   │   ├── obfuscation.json
│   │   └── credential-patterns.json
│   ├── scoring.ts            # Score calculation from findings
│   ├── reporter.ts           # Terminal output formatting
│   └── types.ts              # TypeScript interfaces
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE                   # MIT
└── .github/
    └── workflows/
        └── publish.yml       # npm publish on tag
```

## README.md

The README is the entire marketing surface. It needs to do three things:

1. Explain what this is in one sentence
2. Show installation and usage in under 10 seconds of reading
3. Show example output so people immediately understand the value

Structure:

```markdown
# AcidTest

Security scanner for AI agent skills. Scan before you install.

## Quick Start

\`\`\`bash
npx acidtest scan ./my-skill
\`\`\`

## What It Checks

- Permission mismatches between declared and actual capabilities
- Prompt injection patterns in skill instructions
- Undeclared network calls, file access, and credential harvesting in handler code
- Data exfiltration patterns
- Obfuscated or encoded payloads
- Supply chain risk indicators

## Example Output

[screenshot or formatted code block of the terminal output]

## Why

The AgentSkills ecosystem has 66,000+ skills. Audits have found that 26% contain
at least one vulnerability. 230+ confirmed malicious skills were uploaded to ClawHub
in the first week of February 2026 alone.

AcidTest gives you a quick gut check before you install.

## Install

\`\`\`bash
npm install -g acidtest
\`\`\`

Or use without installing:

\`\`\`bash
npx acidtest scan ./path-to-skill
\`\`\`

## Usage

\`\`\`bash
# Scan a skill directory
acidtest scan ./my-skill

# Scan all skills in a directory
acidtest scan-all ./skills

# JSON output
acidtest scan ./my-skill --json
\`\`\`

## Contributing Patterns

Detection patterns are stored as JSON files in src/patterns/.
To add a new pattern, edit the relevant JSON file and submit a PR.

## License

MIT
```

## What Is NOT in v1

- No web interface
- No API
- No database
- No user accounts
- No badge system
- No registry integration
- No ML/AI-powered analysis
- No remote skill fetching (user downloads the skill first, then scans locally)
- No auto-fix or remediation
- No CI/CD integration (comes in v2 as a GitHub Action)
- No comparison against known-good versions
- No VirusTotal integration
- No Cisco AI Defense integration
- No any-third-party integration

v1 is a local CLI that reads files and prints results. Nothing more.

## Build Priority Order

1. Types and interfaces (types.ts)
2. Pattern library JSON files (fill with real patterns)
3. Layer 1: Permission audit (simplest, validates the parsing pipeline)
4. Layer 2: Prompt injection scan (regex against markdown, fast to build)
5. Layer 3: Code analysis (AST parsing, most complex layer)
6. Layer 4: Cross-reference (combines findings from 1-3)
7. Scoring engine
8. Terminal reporter with chalk formatting
9. JSON reporter
10. CLI entry point with arg parsing
11. scan-all command (iterate directories)
12. package.json with bin field for npx support
13. README
14. Test against real skills downloaded from ClawHub

## npm Package Configuration

```json
{
  "name": "acidtest",
  "version": "0.1.0",
  "description": "Security scanner for AI agent skills. Scan before you install.",
  "bin": {
    "acidtest": "./dist/index.js"
  },
  "files": [
    "dist"
  ],
  "keywords": [
    "security",
    "agent",
    "agentskills",
    "openclaw",
    "moltbot",
    "skill-scanner",
    "prompt-injection",
    "ai-security"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOURUSERNAME/acidtest"
  },
  "homepage": "https://acidtest.dev"
}
```

## Definition of Done

The tool is done when:
1. `npx acidtest scan ./test-skill` works from a cold install
2. It correctly identifies at least 3 categories of risk in a known-malicious test skill
3. It produces clean, readable terminal output with colored severity levels
4. It produces valid JSON with --json flag
5. It runs in under 2 seconds for a single skill scan
6. It has zero runtime dependencies that require API keys or network access
7. The README clearly explains what it does and how to use it
8. It's published to npm and installable globally

## Post-Launch (Not Part of This Build)

These are future considerations, not current scope:
- Download and scan top 500 ClawHub skills for the audit blog post
- GitHub Action for CI/CD integration
- Web scanner at acidtest.dev
- Badge/verification system for skill authors
- Community pattern contribution workflow
- Pre-install hook for OpenClaw
