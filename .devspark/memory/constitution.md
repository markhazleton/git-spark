# Git Spark Constitution

## Core Principles

### I. Analytical Transparency (NON-NEGOTIABLE)
Never guess or fabricate metrics that cannot be derived from Git commit history alone. Every metric must clearly state its data source and limitations. Better to report "cannot measure" than to provide misleading insights.

### II. Test-First
Tests are written and approved before implementation. TDD mandatory: Red-Green-Refactor cycle. Coverage thresholds enforced (branches: 75%, functions: 87%, lines: 86%).

### III. Security-First
All Git command execution uses parameterized `spawn()` — never shell string concatenation. All HTML output is escaped. CSP headers use SHA-256 hashes for inline scripts. No unsafe-inline.

### IV. Simplicity
Only make changes that are directly requested or clearly necessary. No over-engineering, no speculative features. YAGNI principles enforced.

### V. Honesty
Metric names must reflect what is actually measured: `commitTimePattern` not `workingHours`, `reviewWorkflowDetection` not `codeReviewCoverage`. All metrics include a `limitations` object.

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode, `noImplicitAny`, `exactOptionalPropertyTypes`)
- **Module resolution**: bundler (not Node16) — `.js` extension required on all imports
- **CLI**: Commander.js
- **Testing**: Jest with ts-jest, 30s timeout
- **Linting**: ESLint with @typescript-eslint (`no-unsafe-any`)
- **Scripts**: PowerShell (Windows primary)

## Development Workflow

- Run `npm run prebuild` before build/test to generate `src/version.ts`
- All Git operations via `child_process.spawn()` with argument arrays
- Progress callbacks (`ProgressCallback`) flow through all layers
- HTML reports: zero external JS dependencies, native SVG charts, dark mode via `localStorage`

## [SECTION_3_NAME]
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
