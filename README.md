# AcidTest

Security scanner for AI agent skills and MCP servers. Scan before you install.

## The Problem

The AI agent ecosystem is growing rapidly with thousands of skills and MCP servers. Security concerns include:
- **AgentSkills**: 66,000+ skills with 26% containing vulnerabilities
- **230+** confirmed malicious skills uploaded to ClawHub in one week
- **341** skills flagged in the ClawHavoc campaign
- **MCP Servers**: New ecosystem with similar security risks

## Quick Start
```bash
# See AcidTest in action
npx acidtest demo

# Scan an AgentSkills skill
npx acidtest scan ./my-skill

# Scan an MCP server
npx acidtest scan ./my-mcp-server
```

No API keys. No configuration. No Python.

## Example Output
```
AcidTest v0.3.0

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

**For AgentSkills:**
- Prompt injection attempts
- Undeclared network calls
- Credential harvesting
- Permission mismatches
- Data exfiltration patterns
- Obfuscated payloads (regex + entropy analysis)

**For MCP Servers:**
- Dangerous command execution
- Undeclared network access (SSE transport)
- Environment variable credential requests
- Shell binary access
- Permission mismatches between manifest and code

## How It Works

AcidTest runs four analysis layers:
1. **Permission Audit**: Analyzes declared permissions (bins, env, tools)
2. **Prompt Injection Scan**: Detects instruction override attempts (AgentSkills)
3. **Code Analysis**: AST-based analysis of JavaScript/TypeScript files
4. **Cross-Reference**: Catches code behavior not matching declared permissions

Works with both SKILL.md (AgentSkills) and MCP manifests (mcp.json, server.json, package.json).

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

# JSON output for programmatic use
acidtest scan ./my-skill --json

# Start as MCP server (for AI agents)
acidtest serve
```

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

## Scoring

Starts at 100, deducts by severity (CRITICAL: -25, HIGH: -15, MEDIUM: -8, LOW: -3). Score 80+ is PASS, 50-79 is WARN, 20-49 is FAIL, below 20 is DANGER.

## Contributing

Detection patterns are JSON files in `src/patterns/`. Add new patterns and submit a PR.

## License

MIT

## Documentation

- [Technical Specification](./BUILD-SPEC.md) - Architecture and implementation details
- [Roadmap](./ROADMAP.md) - Planned features and enhancements
- [Changelog](./CHANGELOG.md) - Version history

## Links

- Issues: https://github.com/currentlycurrently/acidtest/issues
- Website: https://acidtest.dev
