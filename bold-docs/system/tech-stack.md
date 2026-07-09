## TL;DR

Git Spark's technology stack, development workflow, and quality gates — carried forward from the DevSpark constitution's non-principle sections. Node.js/TypeScript CLI tool; strict typing, ESM-only, PowerShell scripting on Windows.

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

<!-- source: migrated(constitution.md) -->
