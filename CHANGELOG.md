# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2026-02-06

### Fixed
- **JSON Error Handling**: When `--json` flag is used, errors now output valid JSON instead of stderr messages
  - Errors now return structured JSON: `{"status": "ERROR", "error": "message", ...}`
  - Fixes GitHub Actions workflows failing silently when no SKILL.md/MCP manifest found
  - Improves integration with CI/CD pipelines and programmatic usage
- **GitHub Actions Workflows**: Templates now work correctly on acidtest repository itself
  - Auto-detects acidtest repo and scans `test-fixtures` instead of root directory
  - Handles ERROR status properly in all workflow examples
  - Prevents workflow failures when running on the acidtest repository
  - Still functions correctly as templates for users to copy to their skill/MCP repos

### Changed
- Error output format when using `--json` flag is now consistent with scan results
- GitHub Actions workflows now serve dual purpose: testing acidtest + user templates

## [0.5.0] - 2026-02-06

### Added
- **GitHub Actions Integration**: CI/CD workflow templates for automated security scanning
  - `.github/workflows/acidtest-template.yml` - Production-ready template for copying to skill repos
  - `.github/workflows/acidtest-example.yml` - Comprehensive examples with multiple scan strategies
  - Supports pull request scanning, failure thresholds, bulk scanning, and PR comments
  - JSON output parsing for custom workflows
  - Artifact upload for scan results
- **Pre-Commit Hook**: Git hook template for local development workflows
  - `hooks/pre-commit` - Executable hook script with automatic install instructions
  - Blocks commits on DANGER status (configurable to block on FAIL)
  - Displays findings summary before commit
  - Auto-detects acidtest or uses npx if not installed
  - Bypass support with `--no-verify` flag
- **Documentation**: Comprehensive guides for CI/CD integration
  - `hooks/README.md` - Installation and configuration instructions
  - Multiple installation methods (copy, download, symlink)
  - Troubleshooting guide

### Changed
- README.md updated with CI/CD integration section
- Repository now includes reference workflows for community use

### Use Cases Unlocked
- Automated skill/MCP server scanning in GitHub Actions
- Pre-commit validation for developers
- Team/enterprise adoption via CI/CD pipelines
- Automatic PR rejection for malicious contributions

## [0.4.0] - 2026-02-06

### Added
- **Entropy-based Obfuscation Detection**: Shannon entropy analysis for string literals
  - Automatically calculates entropy for all string literals in code
  - Flags strings with entropy >4.5 as potential obfuscation (MEDIUM severity)
  - Smart filtering: skips URLs and short strings (<20 chars) to avoid false positives
  - Detects base64-encoded payloads, random character sequences, and encoded commands
  - Example detection: Base64 strings, hex-encoded data, minified obfuscated code
- Test fixture for entropy detection (`test-fixtures/fixture-entropy/`)

### Technical Details
- Shannon entropy formula: -Σ(p × log₂(p)) where p is character frequency
- Threshold: 4.5 (empirically determined to balance detection vs false positives)
- Minimum string length: 20 characters (shorter strings naturally have lower entropy)
- Implementation: AST-based analysis using TypeScript Compiler API

## [0.3.0] - 2026-02-06

### Added
- **New Attack Patterns**: 5 new detection patterns for broader threat coverage
  - `di-010`: npm/yarn/pnpm install in code (HIGH) - detects runtime package installation
  - `di-011`: git clone/pull/fetch operations (HIGH) - detects repository cloning attempts
  - `ex-007`: Reverse shell patterns (CRITICAL) - detects reverse shell commands (nc -e, /dev/tcp/, bash -i, socat)
  - `ex-008`: DNS lookup functions (MEDIUM) - detects potential DNS exfiltration
  - `ob-006`: Hex decoding (MEDIUM) - detects hex-based obfuscation techniques
- **Enhanced File Discovery**: Expanded ignore patterns to skip irrelevant files
  - Added `coverage/` - test coverage output directories
  - Added `*.min.js` and `*.min.mjs` - minified files (likely third-party)
  - Added `vendor/` - third-party vendor code
- **Documentation**: Added CONTRIBUTING.md and SECURITY.md
  - CONTRIBUTING.md provides clear guidelines for adding detection patterns
  - SECURITY.md establishes vulnerability reporting process and scope
  - Both files improve project professionalism and community engagement

### Fixed
- **Finding Deduplication**: Capped repeated pattern matches at 3 deductions per unique pattern
  - Prevents unfair score inflation when the same pattern triggers many times
  - Example: 50 fetch() calls now deduct 24 points (3 × 8) instead of 400 points (50 × 8)
  - More accurate risk assessment for skills with repetitive patterns

### Changed
- Pattern count: 43 → 48 detection patterns
- File scanning now excludes coverage reports, minified files, and vendor directories

## [0.2.2] - 2025-02-06

### Fixed
- Republished with correct dist/ build (0.2.1 had stale compiled code)

## [0.2.1] - 2025-02-06

### Fixed
- Updated version number in README example output to v0.2.0 (was showing v0.1.1)

## [0.2.0] - 2025-02-06

### Added
- **MCP Server Wrapper**: AcidTest can now run as an MCP (Model Context Protocol) server, allowing AI agents like Claude to scan skills and tools before installation
  - New `acidtest serve` command starts AcidTest in MCP server mode
  - Exposes two tools: `scan_skill` and `scan_all` for agent integration
  - Uses stdio transport for seamless integration with Claude Desktop and other MCP clients
- **MCP Manifest Scanning**: Extended scanning support to MCP server configurations
  - Automatically detects and parses `mcp.json`, `server.json`, `package.json` with MCP config, and `claude_desktop_config.json`
  - Maps MCP concepts (tools, transport, command, env) to existing permission model
  - Applies all four security layers to MCP servers
  - SSE transport automatically flagged as network access
- **Demo Command**: New `acidtest demo` command runs built-in test fixtures
  - Shows full output spectrum (PASS, WARN, FAIL, DANGER) in seconds
  - Perfect for evaluating AcidTest before use
  - Test fixtures now bundled in npm package

### Changed
- CLI help text updated to reflect MCP server and demo capabilities
- `scan` command now accepts MCP manifest files in addition to SKILL.md
- `scan-all` command now discovers both AgentSkills and MCP servers
- Package description updated to reflect broader scope

### Dependencies
- Added `@modelcontextprotocol/sdk` (^1.26.0) for MCP server functionality

### Documentation
- Updated README with MCP server usage and configuration examples
- Added MCP architecture section to BUILD-SPEC.md
- Updated ROADMAP with completed features

## [0.1.2] - 2025-02-06

### Added
- Schema versioning: JSON output now includes `schemaVersion: "1.0.0"` field for API stability
- Test fixtures suite in `test-fixtures/` with 4 baseline cases (PASS, WARN, FAIL, DANGER)
- ROADMAP.md documenting planned features and future enhancements

### Documentation
- Added cross-references between README, BUILD-SPEC, ROADMAP, and CHANGELOG
- Improved contributing guidelines and project navigation

## [0.1.1] - 2025-02-06

### Fixed
- Test files and fixtures are now properly excluded from scans to prevent false positives
- Permissions structure in JSON output is now consistently normalized as arrays
- Skills without declared permissions now return empty arrays instead of undefined fields

### Changed
- Extended glob ignore patterns to exclude common test directories (`__tests__`, `tests`, `*.test.*`, `*.spec.*`)
- Added exclusions for build artifacts (`.next`, `.nuxt`, `.vite*`, `.cache`)
- Permissions output now always includes `bins`, `env`, and `tools` as arrays

## [0.1.0] - 2025-02-06

### Added
- Initial release
- Four-layer security scanning (permissions, injection, code, cross-reference)
- Pattern-based detection system with 6 pattern categories
- TypeScript AST analysis for JavaScript/TypeScript code
- Terminal output with colored severity indicators
- JSON output mode for programmatic integration
- CLI commands: `scan` and `scan-all`
- Trust scoring algorithm (0-100 with PASS/WARN/FAIL/DANGER status)
- Detection for:
  - Prompt injection attempts
  - Undeclared network access
  - Shell execution without permissions
  - Credential harvesting
  - Path traversal
  - Obfuscated code
  - Permission mismatches
  - Deception indicators
