## TL;DR

Git Spark's three Architecture Decision Records: never fabricate metrics, ESM-only module system, and the CSP+SHA-256 HTML security model. Carried forward from `.documentation/adr/README.md`.

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

Principle 1 of [`bold-docs/backbone.md`](../backbone.md). Checked in PR review via `CODEOWNERS` and the PR template analytical integrity checklist.

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

All inline `<script>` content in generated HTML reports is hashed (SHA-256) and the hash is added to the CSP `script-src` directive — no `unsafe-inline`. All user/repo content is HTML-escaped before template insertion. No external CDN dependencies except Bootstrap CSS (integrity-checked). Charts are native SVG, not a client-side charting library.

## Consequences

- Any change to inline script content requires regenerating its CSP hash
- No third-party JS execution surface in generated reports
- Reports remain safe to open even when generated from untrusted repository content

<!-- source: migrated(.documentation/adr/README.md) -->
