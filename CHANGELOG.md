# Changelog

All notable changes to Git Spark will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release preparation
- GitHub Actions CI/CD workflows
- Comprehensive test suite with 80%+ coverage
- Multiple output formats (HTML, JSON, CSV, Markdown, Console)
- Enterprise-grade security features
- Cross-platform support (Windows, macOS, Linux)

## [1.0.0] - 2025-09-29

### Added

- **Core Analytics Engine**
  - Repository health scoring with actionable recommendations
  - Team collaboration analysis and contribution patterns
  - Code quality metrics and risk assessment
  - Timeline visualization and trend analysis
  - Bus factor calculation for team resilience

- **Interactive HTML Reports**
  - Multi-series timeline charts (commits, churn, active authors)
  - Risk factors bar chart with visual breakdown
  - Governance radar chart for commit quality assessment
  - Dark mode toggle with persistent preferences
  - One-click data export (JSON/CSV bundles)
  - Progressive table pagination for performance
  - Dataset toggles with live updates
  - Open Graph preview image generation
  - Accessibility enhancements (ARIA, keyboard navigation)
  - Security-first delivery (CSP, SRI, no unsafe-inline)

- **CLI Interface**
  - Intuitive command-line tool with progress indicators
  - Comprehensive configuration options
  - Email redaction for privacy-sensitive audits
  - Heavy analysis mode with temporal coupling
  - Multiple output format support
  - Cross-platform shell scripts (PowerShell, Batch)

- **Programmatic API**
  - TypeScript/JavaScript library for custom integrations
  - Streaming analysis for large repositories (100k+ commits)
  - Progress callbacks for UI integration
  - Memory optimization and buffer limits
  - Configurable chunking and caching

- **Enterprise Features**
  - Input validation and security hardening
  - Safe Git operations with parameterized commands
  - Comprehensive error handling and logging
  - Configuration-driven analysis with `.git-spark.json`
  - CI/CD integration with JSON output
  - Performance testing and benchmarking

### Technical

- TypeScript 5.9+ with strict configuration
- Jest testing framework with comprehensive coverage
- ESLint + Prettier for code quality
- Commander.js for CLI argument parsing
- Chalk and Boxen for terminal output
- Date-fns for date manipulation
- Glob for file pattern matching
- Node.js 18+ requirement

### Documentation

- Comprehensive README with examples
- TypeScript type definitions
- Configuration schema documentation
- Best practices and troubleshooting guides
- API reference and usage examples

### Security

- Input sanitization and validation
- Path traversal protection
- Buffer size limits for DoS prevention
- Email redaction capabilities
- Safe shell command execution
- Security-focused HTML output (CSP headers)

[Unreleased]: https://github.com/MarkHazleton/git-spark/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/MarkHazleton/git-spark/releases/tag/v1.0.0
