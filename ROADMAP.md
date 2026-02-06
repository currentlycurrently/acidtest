# AcidTest Roadmap

This document outlines the evolution of AcidTest, tracking completed features and planned enhancements based on community feedback and security research.

## Completed

### v0.2.0 (Current)
Focus: Agent integration and MCP server support

- **MCP Server Wrapper** — AcidTest can now run as an MCP (Model Context Protocol) server, exposing security scanning as tools that AI agents like Claude can invoke before installing skills
- **MCP Manifest Scanning** — Extended scanning support to MCP server configurations (mcp.json, server.json, package.json with MCP config)
- **Demo Command** — New `acidtest demo` command runs built-in test fixtures to showcase the full security spectrum (PASS/WARN/FAIL/DANGER)
- **Broader Tool Coverage** — AcidTest now scans both AgentSkills (SKILL.md) and MCP servers with unified four-layer analysis

### v0.1.3
- **Schema versioning** — JSON output includes `schemaVersion` field for API stability
- **Test fixtures** — Minimal test suite for CI validation (PASS/WARN/FAIL/DANGER cases)
- **Documentation** — Cross-referenced docs (README, BUILD-SPEC, ROADMAP, CHANGELOG)

### v0.1.1
- **Test directory exclusion** — Scanner automatically skips `test-skills/` and other test directories to avoid false positives from intentionally malicious test cases
- **Permissions normalization** — Standardized permission declarations (filesystem paths, network patterns, environment variables) for consistent cross-referencing between YAML and code

## Planned

### v0.3.0 (Next Release)
Focus: Pattern management and configurability

- **Pattern JSON schema validation** — JSON Schema for `src/patterns/*.json` files with automated validation on build, ensuring all detection patterns are well-formed before deployment
- **Pattern versioning system** — Semantic versioning for pattern files, allowing skills to declare minimum scanner version and enabling graceful degradation when new patterns are added
- **Optional ignore patterns config** — `.acidtest.json` configuration file for suppressing specific findings (e.g., known false positives in trusted skills), useful for CI/CD workflows

## Future Considerations

These features are under consideration for post-v0.2.0 releases, prioritized based on user demand and security research:

### Advanced Detection
- **Entropy-based obfuscation detection** — Statistical analysis to identify deliberately obscured code (base64 chains, hex-encoded strings, unicode homoglyphs) that may evade regex patterns
- **Hybrid dataflow analysis** — Track environment variable usage and network calls across multiple files, detecting cases where env vars flow into `fetch()` calls to unintended domains

### Integration & Tooling
- **GitHub Action** — Pre-built action for CI/CD pipelines to automatically scan skills on PR/commit, with configurable thresholds for pass/fail
- **Web interface** — Browser-based scanner at `acidtest.dev` for one-off scans without local installation, using WASM-compiled scanner for client-side execution (zero backend)

### Community Features
- **Pattern contribution workflow** — Streamlined process for submitting detection patterns via PR, with automated testing against known-good/known-malicious skill corpus
- **Shared finding database** — Opt-in anonymous telemetry for aggregating common vulnerabilities (skill name hashed), used to prioritize pattern development

## Contributing

AcidTest prioritizes simplicity and zero-configuration operation. Proposed features should align with these principles:

- **No network requirements** — Core scanner must work offline
- **No API keys** — Users shouldn't need accounts or credentials
- **Fast by default** — Sub-2-second scans for typical skills
- **Transparent scoring** — Users must understand why a skill received its score

See the contribution guidelines in the main README for details on submitting patterns, bug reports, or feature requests.

---

Last updated: 2025-02-06
