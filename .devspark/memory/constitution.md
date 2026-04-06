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

## Quality Gates

- All PRs must pass `npm test` with coverage thresholds: branches ≥ 75%, functions ≥ 87%, lines ≥ 86%
- `npm run prebuild` must run before build/test to generate `src/version.ts`
- ESLint (`no-unsafe-any`) must pass with zero errors
- No shell string concatenation in Git command execution — `spawn()` with argument arrays only
- HTML output must be escaped; CSP headers must use SHA-256 hashes (no `unsafe-inline`)

## Governance

- This constitution supersedes all other practices and documentation
- Amendments require: documented rationale, migration plan, and version bump
- Complexity must be justified against YAGNI — default to simplicity
- All development guidance lives in `.devspark/memory/constitution.md`
- Solo project: no external PR approval required, but self-review against constitution before merge

**Version**: 1.0.0 | **Ratified**: 2026-04-05 | **Last Amended**: 2026-04-05
