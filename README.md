# AcidTest

Security scanner for AI agent skills. Scan before you install.


## The Problem

The AgentSkills ecosystem has 66,000+ skills. Recent audits found:
- **26%** contain at least one vulnerability
- **230+** confirmed malicious skills uploaded to ClawHub in one week
- **341** skills flagged in the ClawHavoc campaign

AcidTest gives you a gut check before you install.


## Quick Start

```bash
npx acidtest scan ./my-skill
```

## What It Detects

- **Prompt injection attempts**
- **Undeclared network calls**
- **Credential harvesting**
- **Permission mismatches**
- **Data exfiltration patterns**
- **Obfuscated payloads**

## Example Output

```
AcidTest v0.1.0

Scanning: proactive-agent
Source:   test-skills/proactive-agent-1-2-4-1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRUST SCORE: 72/100 ███████░░░ WARN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINDINGS

  ✖ CRITICAL instruction-override
    SKILL.md:170
    Attempts to override agent instructions
    3 matches found

  ○ LOW      No declared permissions
    SKILL.md
    Skill declares no permissions (bins, env, or allowed-tools)
    Legitimate skills typically declare at least one permission

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDATION: Do not install. Prompt injection attempt detected.
```

## Why

The AgentSkills ecosystem has 66,000+ skills. Audits have found that 26% contain at least one vulnerability. 230+ confirmed malicious skills were uploaded to ClawHub in the first week of February 2026 alone.

AcidTest gives you a quick gut check before you install.

## Install

```bash
npm install -g acidtest
```

Or use without installing:

```bash
npx acidtest scan ./path-to-skill
```

## Usage

```bash
# Scan a skill directory
acidtest scan ./my-skill

# Scan a SKILL.md file directly
acidtest scan ./my-skill/SKILL.md

# Scan all skills in a directory
acidtest scan-all ./skills

# JSON output
acidtest scan ./my-skill --json
```

## How It Works

AcidTest performs a four-layer security analysis:

### Layer 1: Permission Audit
Analyzes YAML frontmatter to identify what the skill declares it needs:
- System binaries (`bins`)
- Environment variables (`env`)
- Agent tools (`allowed-tools`)

Flags dangerous permissions like shell access, network tools, and credential requests.

### Layer 2: Prompt Injection Scan
Scans the markdown content for malicious patterns:
- Instruction override attempts ("ignore previous instructions")
- Hidden obfuscated content (base64, zero-width chars)
- Access to sensitive paths (.ssh, .aws, credentials)
- Data exfiltration instructions

### Layer 3: Code Analysis
Uses TypeScript AST parsing to detect dangerous code patterns:
- Dangerous imports (`child_process`, `eval`, `vm`)
- Network calls (`fetch`, `http.request`, WebSocket)
- File system access with path traversal
- Dynamic code execution
- Credential harvesting

### Layer 4: Cross-Reference
Compares findings across layers to detect deception:
- Code makes network calls but doesn't declare network permissions → **CRITICAL**
- Benign description but contains shell execution → **HIGH**
- Accesses undeclared environment variables → **HIGH**
- Minified code in supposedly simple utility → **MEDIUM**

## Scoring

Each finding has a severity level:
- **CRITICAL**: -25 points (eval, undeclared exfiltration, prompt injection)
- **HIGH**: -15 points (shell execution, dangerous imports)
- **MEDIUM**: -8 points (obfuscation, file access)
- **LOW**: -3 points (minor issues)
- **INFO**: 0 points (informational only)

Trust scores:
- **80-100 (PASS)**: Low risk
- **50-79 (WARN)**: Review recommended
- **20-49 (FAIL)**: High risk, do not install
- **0-19 (DANGER)**: Likely malicious

## Contributing Patterns

Detection patterns are stored as JSON files in `src/patterns/`. To add a new pattern:

1. Choose the appropriate category file
2. Add your pattern following the schema:

```json
{
  "id": "pi-011",
  "name": "pattern-name",
  "description": "What this detects",
  "severity": "CRITICAL",
  "match": {
    "type": "regex",
    "value": "pattern here",
    "flags": "i"
  },
  "layer": "markdown"
}
```

3. Submit a PR

## Development

```bash
# Clone the repo
git clone https://github.com/currentlycurrently/acidtest
cd acidtest

# Install dependencies
npm install

# Build
npm run build

# Test
npm run dev -- scan ./test-skills/example-skill
```

## Philosophy

AcidTest is intentionally simple:
- **Zero network calls** - runs entirely locally
- **Zero API keys** - no external services required
- **Zero configuration** - works out of the box
- **Zero dependencies** (at runtime) - just Node.js

We differentiate from enterprise scanners by being fast, simple, and focused on the individual developer's workflow.

## License

MIT

## Links

- Documentation: [CLAUDE.md](./CLAUDE.md)
- Build Spec: [BUILD-SPEC.md](./BUILD-SPEC.md)
- Issues: https://github.com/currentlycurrently/acidtest/issues
- Website: https://acidtest.dev
