# AcidTest

Security scanner for AI agent skills. Scan before you install.

## The Problem

The AgentSkills ecosystem has 66,000+ skills. Recent audits found:
- **26%** contain at least one vulnerability
- **230+** confirmed malicious skills uploaded to ClawHub in one week
- **341** skills flagged in the ClawHavoc campaign

## Quick Start
```bash
npx acidtest scan ./my-skill
```

No API keys. No configuration. No Python.

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

## What It Detects

- Prompt injection attempts
- Undeclared network calls
- Credential harvesting
- Permission mismatches
- Data exfiltration patterns
- Obfuscated payloads

## How It Works

AcidTest runs four analysis layers: permission audit, prompt injection scan, code analysis (via TypeScript AST), and cross-reference checks that catch when code behavior doesn't match declared permissions.

For technical details, see [BUILD-SPEC.md](./BUILD-SPEC.md).

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

## Scoring

Starts at 100, deducts by severity (CRITICAL: -25, HIGH: -15, MEDIUM: -8, LOW: -3). Score 80+ is PASS, 50-79 is WARN, 20-49 is FAIL, below 20 is DANGER.

## Contributing

Detection patterns are JSON files in `src/patterns/`. Add new patterns and submit a PR.

## License

MIT

## Links

- Issues: https://github.com/currentlycurrently/acidtest/issues
- Website: https://acidtest.dev
