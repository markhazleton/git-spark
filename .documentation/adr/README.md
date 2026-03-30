# ADR-001: Analytical Integrity — Never Guess Metrics

**Status**: Accepted  
**Date**: 2025-09-30  
**Deciders**: Mark Hazleton  
**Supersedes**: N/A

---

## Context

Git repository analytics tools often claim to measure developer productivity, code quality, code review participation, or team collaboration. None of these can be derived from `git log` data alone — only commit timestamps, messages, file diffs, and author identifiers are available.

Tools that fabricate such metrics mislead engineering managers and can be used harmfully in performance reviews.

## Decision

Git Spark will **never present a metric that cannot be directly derived from Git commit metadata**. Specifically:

- No code review coverage (not in Git)
- No actual work hours or timezone inference presented as fact (timestamps ≠ work hours)
- No deployment or build quality metrics (not in Git)
- No organizational hierarchy or team roles (not in Git)

When a proxy metric is shown (e.g., "commit time pattern" as a proxy for work schedule), it **must** include a `limitations` object explaining:
- `dataSource`: what raw data it uses
- `estimationMethod`: how the value is derived
- `knownLimitations[]`: what it cannot capture
- `recommendedApproach`: how to get accurate data if needed

Metric names must reflect their actual source: `commitTimePattern` not `workingHours`.

## Consequences

- Users can trust every number in a Git Spark report as factual
- The tool cannot compete on superficially impressive but misleading dashboards
- Every new metric requires a limitations review before merging

## Enforcement

Principle III of the [project constitution](.documentation/memory/constitution.md). Checked in PR review via `CODEOWNERS` and the PR template analytical integrity checklist.

---

# ADR-002: ESM-Only Module System

**Status**: Accepted  
**Date**: 2025-09 (project inception)  
**Deciders**: Mark Hazleton

---

## Context

Node.js supports both CommonJS (`require`) and ES Modules (`import/export`). Key dependencies — Chalk 5.x, Ora — are ESM-only. CommonJS interop with ESM requires dynamic `import()` which complicates consumer usage.

## Decision

Git Spark is published as ESM-only (`"type": "module"` in `package.json`). All source files are `.ts` with ESM imports using `.js` extensions (TypeScript bundler resolution mode). No CommonJS shim/dual-publish is provided.

## Consequences

- CommonJS consumers must use dynamic `import()` — documented in package README
- `npx @arethetypeswrong/cli` validates this in CI (`package-check` job)
- `moduleNameMapper` in Jest strips `.js` extensions for test resolution
- All new imports must use `.js` extension, including imports of `.ts` files

---

# ADR-003: HTML Security Model — CSP + SHA-256 Hashing

**Status**: Accepted  
**Date**: 2025-10  
**Deciders**: Mark Hazleton

---

## Context

HTML reports embed JavaScript and CSS inline for portability (self-contained, offline-capable files). The standard approach of `unsafe-inline` in Content Security Policy would allow script injection via XSS.

## Decision

All inline `<script>` blocks use a nonce derived from the SHA-256 hash of the script content. All inline `<style>` blocks use a SHA-256 `'sha256-...'` hash in the CSP header. No `unsafe-inline` is permitted in any CSP directive.

Additionally:
- All user-derived content (repo name, author names, commit messages) is escaped via `escapeHtml()` before template insertion
- No external chart library CDN dependencies (native SVG charts only)
- Bootstrap CSS is the only external origin, loaded with SRI integrity attribute

## Consequences

- Every change to an inline script or style in `html.ts` requires a CSP hash update — this is enforced by tests (`html-exporter.test.ts` checks for valid CSP headers)
- New template variables must pass through `escapeHtml()` — the PR template includes this checklist
- The report is safe to embed in air-gapped or enterprise intranet environments

---

# ADR-004: Three-Layer Architecture

**Status**: Accepted  
**Date**: 2025-09 (project inception)  
**Deciders**: Mark Hazleton

---

## Context

Without enforced layer separation, CLI logic leaks into analysis code, making it difficult to use the analyzer programmatically. Output formatters can grow to include business logic, making them fragile.

## Decision

Strict three-layer architecture:

1. **CLI** (`src/cli/`): Parses arguments, validates inputs, calls analyzer, passes result to exporters. No business logic.
2. **Core** (`src/core/`): Pure functions. Receives typed inputs, returns typed outputs. No I/O, no CLI dependencies.
3. **Output** (`src/output/`): Receives `AnalysisReport`, produces files. No Git calls, no analysis.

Cross-cutting: `src/utils/` (Git command execution, logging, validation), `src/types/` (shared types only).

## Consequences

- The analyzer can be imported and used as a library (`import { analyze } from 'git-spark'`)
- Output formatters are independently testable with mock `AnalysisReport` data
- CI job `package-check` validates the public API surface via `publint`
- `CODEOWNERS` enforces that `src/core/` changes always require Lead Architect review

---

# ADR-005: Git Commands via spawn() — No Shell Injection

**Status**: Accepted  
**Date**: 2025-09 (project inception)  
**Deciders**: Mark Hazleton

---

## Context

Naive Git integrations concatenate user-provided repository paths or branch names into shell command strings. This enables shell injection attacks when the tool is used as a library or exposed via a web interface.

## Decision

All Git operations in `src/utils/git.ts` use `child_process.spawn()` with a separate argument array. User-controlled values (repo paths, branch names, author filters, date strings) are always passed as array elements, never interpolated into command strings.

Additionally, a 200MB buffer limit is applied to all Git operations to prevent DoS via repositories with extremely large file histories.

## Consequences

- Shell injection is structurally impossible for all existing Git calls
- New contributors must follow the same pattern — enforced by the PR template security checklist and `CODEOWNERS` on `src/utils/git.ts`
- Buffer limit is configurable via `GitSparkConfig` for large-repo use cases
