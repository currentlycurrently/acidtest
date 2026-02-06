# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
