# Contributing to Git Spark

Thank you for your interest in contributing to Git Spark. This guide helps you get set up quickly and understand the conventions that keep the codebase consistent.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Adding New Features](#adding-new-features)
- [Good First Issues](#good-first-issues)

---

## Quick Start

```bash
git clone https://github.com/MarkHazleton/git-spark.git
cd git-spark
npm install
npm run build
npm test
```

Run against the repo itself to see a live report:

```bash
node bin/git-spark.js html --days=30 --output=./reports
```

---

## Architecture Overview

Git Spark uses a strict **three-layer pipeline**. Changes must respect layer boundaries:

```
src/cli/       ← Argument parsing, option validation, user interaction
src/core/      ← Data collection and metric calculation (no I/O)
src/output/    ← Format-specific serialization (HTML, JSON, CSV, MD, Console)
src/utils/     ← Shared utilities (Git commands, logging, validation)
src/types/     ← TypeScript type definitions (no logic)
```

### Key Files to Know

| File | Purpose |
|------|---------|
| [src/cli/commands.ts](src/cli/commands.ts) | CLI entry — Commander.js commands and option wiring |
| [src/core/collector.ts](src/core/collector.ts) | Spawns `git log` to collect raw commit data |
| [src/core/analyzer.ts](src/core/analyzer.ts) | Calculates all metrics from raw commit data |
| [src/output/html.ts](src/output/html.ts) | Generates the interactive HTML report |
| [src/output/html-utils.ts](src/output/html-utils.ts) | HTML escaping and shared rendering helpers |
| [src/utils/git.ts](src/utils/git.ts) | All Git command execution (always via `spawn()`) |
| [src/utils/validation.ts](src/utils/validation.ts) | Input validation for CLI options |
| [src/types/index.ts](src/types/index.ts) | Central type definitions |

### Data Flow

```
CLI options
    ↓
Collector (git log → raw commits)
    ↓
Analyzer (commits → AnalysisReport)
    ↓
Exporter (AnalysisReport → HTML / JSON / CSV / MD)
```

---

## Development Workflow

### Build & Test

```bash
npm run prebuild       # Generates src/version.ts from package.json (run before anything)
npm run build          # TypeScript → dist/
npm test               # Jest with ts-jest
npm run test:coverage  # With coverage report
npm run lint           # ESLint
```

> **Always run `npm run prebuild` before `npm test`** — version detection depends on it.

### Pre-commit Hook

Husky runs `npm test` before every commit. All tests must pass. Coverage thresholds are enforced:

| Metric | Threshold |
|--------|-----------|
| Branches | ≥ 75% |
| Functions | ≥ 87% |
| Lines | ≥ 86% |
| Statements | ≥ 85% |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add branch comparison option
fix: handle empty repository in analyzer
docs: update README quick start section
test: add edge case coverage for file filtering
refactor: extract CSS generation to html-styles module
chore: bump dependencies
ci: upgrade CodeQL to v4
```

---

## Code Conventions

### TypeScript

- Strict mode is on: no `any` without explicit comment, no unused locals  
- All imports use `.js` extension (ESM bundler resolution mode):  
  ```typescript
  import { escapeHtml } from './html-utils.js';   // ✅
  import { escapeHtml } from './html-utils';      // ❌
  ```
- Use `child_process.spawn()` with argument arrays for all Git commands — never template strings.

### File Size Limits (from constitution)

| Threshold | Action |
|-----------|--------|
| > 500 lines | SHOULD refactor into sub-modules |
| > 1000 lines | MUST refactor before merging |

### HTML Output Security

Every new piece of user-derived content in HTML templates must be escaped:

```typescript
// ✅ Safe
`<td>${escapeHtml(author.name)}</td>`

// ❌ Unsafe — XSS risk
`<td>${author.name}</td>`
```

When adding inline `<script>` blocks, update the SHA-256 hash in `generateHTML()`.

### Analytical Integrity

Git Spark **never** claims to measure things it cannot. If you add a metric:

1. Verify the data exists in `git log` output (author, date, files, message only)
2. Use honest naming: `commitTimePattern` ≠ `workingHours`
3. Include a `limitations` section:

```typescript
limitations: {
  dataSource: 'git-commits-only',
  estimationMethod: 'commit message pattern analysis',
  knownLimitations: ['Cannot detect actual code review participation'],
  recommendedApproach: 'Supplement with platform API data (GitHub/GitLab)'
}
```

---

## Adding New Features

### New CLI Option

1. Add `.option()` in `src/cli/commands.ts`
2. Add field to `GitSparkOptions` in `src/types/index.ts`
3. Add validation in `src/utils/validation.ts`
4. Wire into `executeAnalysis()` in `src/cli/commands.ts`
5. Add test in `test/cli-commands.test.ts`

### New Metric in Author Analysis

1. Define interface addition in `src/types/author.ts`
2. Calculate in `src/core/analyzer.ts` → `calculateDetailedAuthorMetrics()`
3. Add `limitations` documentation
4. Render in `src/output/html.ts` → Author Profile Cards section (update CSP hash)
5. Add test with known commit data

### New Output Format

1. Create `src/output/<format>.ts` implementing an `export(report, outputPath)` function
2. Register in `src/cli/commands.ts` format switch
3. Export from `src/index.ts`
4. Add test in `test/<format>-exporter.test.ts`

---

## Good First Issues

Look for issues labeled [`good first issue`](https://github.com/MarkHazleton/git-spark/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) on GitHub.

Typical entry points for new contributors:

- **Console output improvements** (`src/output/console.ts`) — less security-sensitive than HTML
- **Markdown report additions** (`src/output/markdown.ts`) — straightforward templating
- **Utility functions** (`src/utils/`) — isolated, well-tested, low risk  
- **Test coverage** — add test cases for edge cases flagged in coverage reports
- **Documentation** — README improvements, JSDoc additions to public API

---

## Questions?

Open a [GitHub Discussion](https://github.com/MarkHazleton/git-spark/discussions) or file an [issue](https://github.com/MarkHazleton/git-spark/issues).
