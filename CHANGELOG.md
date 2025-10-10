# Changelog

All notable changes to Git Spark will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Current Repository State Enhancements**
  - Executive Summary-style metrics grid layout for consistency
  - Professional table layouts with data-table styling throughout
  - Repository filesystem statistics with extension, category, and directory breakdowns

### Fixed

- **Directory Counting Bug**
  - Fixed "N/A" display for directory counts in Current Repository State section
  - Root cause: Interface mismatch between analyzer (`topDirectories`) and HTML template (`directoryBreakdown`)
  - Directory count now correctly displays actual numbers and detailed breakdown table
  - Updated HTML template field references to use correct analyzer data structure

### Changed

- **Layout Improvements**
  - Current Repository State section now matches Executive Summary styling
  - Consistent metric-card design across all summary sections
  - Enhanced table layouts with proper data-table CSS classes

## [1.0.183] - 2025-10-08

### Fixed

- **HTML Report Meta Tag**
  - Removed extra `>` character in `og:description` meta tag causing validation error

- **Volume Trends Sparkline Visualization**
  - Fixed completely flat sparklines that weren't reflecting data variation
  - Root cause: CSS flexbox `flex: 1` property was overriding height styles
  - Migrated from div-based flexbox implementation to SVG coordinate system for precise control

### Changed

- **Volume Trends Layout**
  - Made Volume Trends section full-width using `grid-column: 1 / -1`
  - Matches layout style of Daily Commits and Active Authors sections
  - Improved visual consistency in Visual Trend Analysis section

- **Sparkline Implementation**
  - Replaced CSS flexbox bars with SVG `<rect>` elements
  - Added gradient fills using `<linearGradient>` for visual enhancement
  - Implemented bottom-aligned coordinate positioning (`y = chartHeight - height`)
  - Data-driven height calculation now properly visualizes variations

### Technical

- Updated `src/output/html.ts` - Complete sparkline rewrite using SVG (lines 2755-2825)
- Modified CSS Grid layout for full-width sparklines (line 1567)
- Removed flexbox sparkline styles, added SVG container styles (lines 1607-1615)
- Updated `test/html-exporter.test.ts` - Changed test expectations from `.spark-bar` divs to `<svg>` elements
- All 217 tests passing with new SVG implementation
- Version bump from 1.0.175 to 1.0.183

## [1.0.170] - 2025-10-07

### Fixed

- **Critical Bug: First Commit Date Detection**
  - Fixed `getFirstCommitDate()` method that was returning incorrect dates
  - Removed problematic `--max-count=1` flag that limited results before reversing
  - Now uses `--all --reverse` to find true repository first commit across all branches
  - Resolves issue where `--days=300` returned 0 commits despite recent activity

- **Date Range Calculation**
  - Added repository lifetime capping to prevent analysis periods before first commit
  - Implemented timezone-safe date handling by subtracting 1 day from first commit
  - Fixed analysis period display showing impossible dates (before repository creation)
  - Added comprehensive debug logging for date comparisons

### Changed

- **HTML Report Navigation**
  - Reorganized navigation menu to match visual section order
  - Final order: Summary → Authors → Team Patterns → Files → Author Details → Detailed Daily Tables → Limitations → Documentation → Metadata
  - Split "Daily Activity Trends" section for better organization:
    - Moved visualizations (Analysis Period Overview, Contributions Calendar, Visual Trend Analysis) to Team Patterns section
    - Kept detailed tables in separate "Detailed Daily Tables" section at bottom
  - Positioned "Detailed Daily Tables" between Author Details and Limitations for logical flow

### Technical

- Updated `src/utils/git.ts` - Complete rewrite of `getFirstCommitDate()` method
- Enhanced `src/core/collector.ts` - Added repository lifetime capping with timezone safety
- Modified `src/output/html.ts` - Navigation reordering and date display improvements
- Updated `test/git-utils.test.ts` - Test expectations match new implementation
- All 217 tests passing with updated logic

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

[Unreleased]: https://github.com/MarkHazleton/git-spark/compare/v1.0.183...HEAD
[1.0.183]: https://github.com/MarkHazleton/git-spark/compare/v1.0.170...v1.0.183
[1.0.170]: https://github.com/MarkHazleton/git-spark/compare/v1.0.0...v1.0.170
[1.0.0]: https://github.com/MarkHazleton/git-spark/releases/tag/v1.0.0
