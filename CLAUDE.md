# CLAUDE.md

## Project Context

AcidTest is a security scanner for AI agent skills. It scans AgentSkills-format skill packages (SKILL.md + handler code) for security risks before installation.

The target user is an individual developer installing skills for OpenClaw, Claude Code, or other agent platforms. They want a quick gut check, not an enterprise security audit. The tool must be fast, zero-config, and work from a single npx command.

Competitor context: Cisco has an open-source skill-scanner (Python, 147 GitHub stars, enterprise-oriented, requires optional API keys). AcidTest differentiates on simplicity — zero dependencies beyond Node.js, no API keys, no configuration, instant results.

## Quick Reference

```bash
# Run the scanner
npx acidtest scan ./path-to-skill

# Run with JSON output  
npx acidtest scan ./path-to-skill --json

# Scan multiple skills
npx acidtest scan-all ./skills-directory

# Development
npm install
npm run build
npm run dev -- scan ./test-skills/example-skill
```

## Architecture

```
src/
├── index.ts          # CLI entry (arg parsing, command routing)
├── scanner.ts        # Orchestrates the four scanning layers
├── layers/
│   ├── permissions.ts   # Layer 1: YAML frontmatter audit
│   ├── injection.ts     # Layer 2: Markdown prompt injection patterns
│   ├── code.ts          # Layer 3: JS/TS AST analysis
│   └── crossref.ts      # Layer 4: Cross-reference findings
├── patterns/            # JSON pattern files (community-editable)
├── scoring.ts           # Calculate trust score from findings
├── reporter.ts          # Terminal output with chalk
└── types.ts             # TypeScript interfaces
```

## Key Design Decisions

**Zero network calls.** The scanner runs entirely locally. No phoning home, no API calls, no telemetry. Users are trusting this tool to audit other code — it must be trustworthy itself.

**Patterns in JSON, not code.** Detection patterns live in `src/patterns/*.json`. This lets contributors add patterns without touching scanner logic. Each pattern has an ID, severity, regex or AST matcher, and the layer it applies to.

**Four-layer scanning.** Each layer builds on the previous:
1. Permissions — what the skill *claims* it needs
2. Injection — hidden instructions in the markdown
3. Code — what the handlers *actually do*
4. Cross-reference — mismatches between claims and reality

**Scoring is transparent.** The score formula is simple subtraction from 100 based on finding severity. Users see every finding that contributed to the score. No black box.

## File Formats

### SKILL.md (what we scan)

```markdown
---
name: example-skill
description: Does a thing
version: 1.0.0
env:
  - API_KEY
bins:
  - curl
allowed-tools:
  - browser
---

# Example Skill

Instructions for the agent go here...
```

### Pattern files (our detection rules)

```json
{
  "category": "prompt-injection",
  "patterns": [
    {
      "id": "pi-001",
      "name": "instruction-override",
      "severity": "CRITICAL",
      "match": {
        "type": "regex",
        "value": "ignore\\s+(all\\s+)?(previous|prior)\\s+instructions",
        "flags": "i"
      },
      "layer": "markdown"
    }
  ]
}
```

## Code Style

- TypeScript strict mode
- Explicit types, no `any` unless absolutely necessary
- Functions over classes where possible
- Early returns over nested conditionals
- Descriptive variable names — `skillPath` not `p`
- Comments explain *why*, not *what*

## Dependencies

Keep these minimal:
- `gray-matter` — YAML frontmatter parsing
- `typescript` — AST parsing (use compiler API directly, not a wrapper)
- `chalk` — terminal colors
- `glob` — file discovery

Do not add:
- Express or any web framework
- Database drivers
- HTTP clients
- ML/AI libraries
- Anything that requires API keys

## Testing Approach

Use real skills for testing, not mocks. The `test-skills/` directory should contain:
- Known-good skills (expect PASS)
- Known-malicious skills (expect FAIL/DANGER)
- Edge cases (unusual structures, empty files, malformed YAML)

A skill passes the "real test" when scanning it produces findings that match what a human reviewer would flag.

## Common Tasks

### Adding a new detection pattern

1. Identify which layer it belongs to (permissions, injection, code, crossref)
2. Add the pattern to the appropriate JSON file in `src/patterns/`
3. Give it a unique ID, clear name, and appropriate severity
4. Test against a skill that should trigger it

### Adding a new CLI command

1. Add argument parsing in `src/index.ts`
2. Route to a handler function
3. Keep the command interface simple — prefer flags over subcommands

### Changing the scoring formula

Edit `src/scoring.ts`. The formula is intentionally simple:
- Start at 100
- Subtract based on severity (CRITICAL: 25, HIGH: 15, MEDIUM: 8, LOW: 3)
- Floor at 0

### Debugging a scan

Run with Node's inspector:
```bash
node --inspect-brk dist/index.js scan ./path-to-skill
```

Or add console.log statements — this is a CLI tool, not a long-running service. Debug logging is fine during development.

## What Success Looks Like

The tool is done when:
1. `npx acidtest scan ./test-skill` works cold
2. Correctly identifies risks in known-malicious skills
3. Produces clean terminal output with colors
4. Produces valid JSON with --json flag
5. Runs in under 2 seconds per skill
6. Zero runtime API key requirements
7. Published to npm

## What's Out of Scope (v1)

- Web interface
- Remote skill fetching
- Database or persistence
- User accounts
- CI/CD integration (v2)
- Auto-remediation
- Any third-party API integration

Build the simplest thing that works. Ship it. Iterate based on real usage.
