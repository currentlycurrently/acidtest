# AcidTest Roadmap

This document outlines the evolution of AcidTest, tracking completed features and planned enhancements based on community feedback and security research.

## Completed

### v0.6.0 (Current)
Focus: Test coverage and improved bypass detection

- **Test suite** — Comprehensive test coverage using Vitest with 54 passing tests
  - Unit tests for core scanning logic (scanner, scoring, layers)
  - Tests for each layer independently (permissions, injection, code, crossref)
  - Tests for scoring calculations and deduction caps
  - Tests for pattern matching accuracy and bypass detection
  - Enables confident refactoring and unblocks community contributions

- **Enhanced AST bypass detection** — Catches sophisticated evasion techniques
  - Property access patterns: `global['child_process']` (MEDIUM severity)
  - String concatenation in require: `require('child_' + 'process')` (HIGH severity)
  - Template literals: `` require(`child_${x}`) `` (caught as dynamic require)
  - Function constructor: `new Function('return eval')()` (CRITICAL severity)
  - All patterns now have unique `patternId` for proper deduplication

- **Methodology documentation** — Transparent about capabilities and limitations
  - New METHODOLOGY.md documenting what static analysis can/cannot detect
  - Honest assessment: catches ~85-90% of attacks, not foolproof
  - Known bypass techniques documented with examples
  - Clear guidance on when to use vs not use AcidTest
  - Comparison to other security tools (npm audit, sandboxing, manual review)

### v0.5.3
Focus: Quality improvements and false positive reduction

- **Entropy detection improvements** — Reduced false positives by filtering JWTs, UUIDs, hashes, and proper base64 strings
- **Honest documentation** — Removed uncited third-party statistics, clearer positioning about actual risks
- **Pattern refinements** — Better detection of legitimate vs suspicious high-entropy strings

### v0.5.2
Focus: CI/CD workflow fixes

- **Workflow reliability** — Fixed GitHub Actions failures on acidtest repository
- **Local build support** — Workflows now build from source when running on acidtest repo
- **Smart fixture testing** — Only scans PASS fixtures in CI to avoid false failures from test cases

### v0.5.1
Focus: Error handling improvements

- **JSON error output** — Errors now output valid JSON when `--json` flag is used
- **ERROR status type** — Added ERROR status with proper TypeScript types
- **Workflow error handling** — Templates handle errors correctly with structured output

### v0.5.0
Focus: CI/CD integration and automation

- **GitHub Actions workflows** — Production-ready templates for automated security scanning in CI/CD pipelines
- **Pre-commit hook** — Git hook template blocks malicious commits before they reach the repository
- **Workflow examples** — Multiple strategies: simple scan, threshold-based, bulk scanning, PR comments
- **Team adoption** — Unlocks enterprise/organization-wide deployment

### v0.4.0
Focus: Advanced obfuscation detection

- **Entropy-based obfuscation detection** — Shannon entropy analysis automatically detects high-entropy strings (>4.5) that may indicate base64 encoding, hex encoding, or other obfuscation techniques
- **Smart filtering** — Entropy detection skips URLs and short strings to minimize false positives
- **Test coverage** — New test fixture for entropy detection validation

### v0.3.0
Focus: Enhanced detection coverage and community readiness

- **Finding deduplication** — Fixed scoring bug where repeated patterns inflated deductions; now capped at 3 per unique pattern for accurate risk assessment
- **Expanded attack patterns** — 5 new patterns (48 total): npm/yarn/pnpm install, git clone, reverse shells, DNS exfiltration, hex obfuscation
- **Enhanced file discovery** — Scanner now skips coverage/, *.min.js, and vendor/ directories to avoid false positives
- **Community documentation** — Added CONTRIBUTING.md and SECURITY.md for pattern contributions and vulnerability reporting

### v0.2.2
Patch release: Build fix

- **Build correction** — Republished with correct dist/ build (0.2.1 had stale compiled code)

### v0.2.0
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

### v0.7.0 (Next Major Release)
Focus: Enhanced dataflow analysis

**Priority: Medium | Complexity: High**
- **Basic dataflow analysis** — Track tainted values from sources (user input, env vars, network) to dangerous sinks (exec, eval, fetch)
- **Enhanced cross-reference** — Extract actual fetch() URLs from AST and check if environment variables are sent in network requests
- **AST-based env var extraction** — Replace regex with TypeScript AST traversal to catch dynamic access patterns

### v0.8.0
Focus: Pattern management and configurability

**Priority: Medium | Complexity: Low**
- **Pattern JSON schema validation** — JSON Schema for `src/patterns/*.json` files with automated validation on build
- **Optional ignore patterns config** — `.acidtest.json` configuration file for suppressing specific findings (useful for CI/CD)
- **Pattern contribution workflow** — Streamlined PR process with automated testing against known-good/malicious skill corpus

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

Last updated: 2026-02-07
