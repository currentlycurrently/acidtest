# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
