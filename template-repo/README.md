# AI Agent Skill Template

A starter template for building secure AI agent skills and MCP servers with AcidTest pre-configured.

## Features

✅ **Pre-configured AcidTest** - Security scanning on every PR
✅ **TypeScript setup** - Type-safe development
✅ **SKILL.md template** - AgentSkills format
✅ **Best practices** - Secure coding guidelines
✅ **CI/CD ready** - GitHub Actions workflows included

## Quick Start

### 1. Use This Template

Click the "Use this template" button above to create a new repository.

### 2. Install Dependencies

```bash
npm install
```

### 3. Customize Your Skill

Edit `SKILL.md` with your skill's details:
- Name and description
- Required permissions (bins, env, tools)
- Usage instructions

### 4. Implement Your Handler

Edit `src/handler.ts` with your skill's logic.

### 5. Test Security

```bash
npx acidtest scan .
```

You should see a **PASS** score (80+/100).

## Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── acidtest.yml          # Security scan on push/PR
│       └── test.yml              # Unit tests (optional)
├── src/
│   └── handler.ts                # Your skill implementation
├── SKILL.md                      # Skill manifest
├── .acidtest.json                # AcidTest configuration
├── package.json
├── tsconfig.json
└── README.md                     # This file
```

## Configuration

### AcidTest Settings

Edit `.acidtest.json` to customize security scanning:

```json
{
  "ignore": {
    "patterns": [],
    "categories": []
  },
  "thresholds": {
    "minScore": 80,
    "failOn": ["CRITICAL", "HIGH"]
  }
}
```

### GitHub Actions

The template includes two workflows:

**`acidtest.yml`** - Runs security scan on every push/PR
- Fails if score < 80/100
- Comments on PRs with detailed results

**`test.yml`** - Runs your unit tests (if you add them)

## Best Practices

### ✅ DO:
- Declare all permissions in `SKILL.md` frontmatter
- Use static `require()` and `import` statements
- Document why you need each permission
- Run `npx acidtest scan .` before committing
- Keep dependencies minimal and audited

### ❌ DON'T:
- Use `eval()`, `Function()`, or `vm` module
- Import `child_process` unless absolutely necessary
- Access undeclared environment variables
- Make network calls without declaring browser/network tools
- Obfuscate code or use base64 encoding unnecessarily

## Security Scanning

This template uses [AcidTest](https://github.com/currentlycurrently/acidtest) for automated security scanning.

### Local Scanning

```bash
# Basic scan
npx acidtest scan .

# Watch mode (re-scan on changes)
npx acidtest scan . --watch

# Show fix suggestions
npx acidtest scan . --fix

# JSON output
npx acidtest scan . --json
```

### CI/CD Integration

Security scans run automatically on:
- Every push to main
- Every pull request
- Manual workflow dispatch

Results are commented on PRs automatically.

## Scoring

AcidTest uses a 100-point trust score:

| Score | Status | Meaning |
|-------|--------|---------|
| 80-100 | PASS ✅ | Safe to use |
| 50-79 | WARN ⚠️ | Review recommended |
| 20-49 | FAIL ❌ | Not recommended |
| 0-19 | DANGER 🔴 | Do not use |

**Goal:** Keep your skill at 80+ (PASS status)

## Troubleshooting

### "No SKILL.md found"
Make sure `SKILL.md` exists in the repository root.

### "Score too low"
Run `npx acidtest scan . --fix` to see remediation suggestions.

### "Test files scanned"
Test files (`.test.ts`, `.spec.ts`) are automatically excluded.

### "False positives"
Add pattern IDs to `.acidtest.json` ignore list:
```json
{
  "ignore": {
    "patterns": ["sp-006", "ob-001"]
  }
}
```

## Resources

- [AcidTest Documentation](https://github.com/currentlycurrently/acidtest)
- [AcidTest Methodology](https://github.com/currentlycurrently/acidtest/blob/main/METHODOLOGY.md)
- [Security Best Practices](https://github.com/currentlycurrently/acidtest/blob/main/docs/best-practices.md)
- [CI/CD Integration Guide](https://github.com/currentlycurrently/acidtest/blob/main/docs/ci-cd.md)

## License

MIT

---

**Built with [AcidTest](https://github.com/currentlycurrently/acidtest)** - Security scanner for AI agent skills
