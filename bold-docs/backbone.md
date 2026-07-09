# git-spark — Backbone

## Principles

1. **Never guess or fabricate a metric that cannot be derived from Git commit history alone.** Every metric states its data source and limitations; "cannot measure" beats a misleading number.
   <!-- source: migrated(constitution.md) -->
   **Status**: enforced

2. **Tests are written and approved before implementation.** Red-Green-Refactor. Coverage thresholds enforced: branches ≥75%, functions ≥87%, lines ≥86%.
   <!-- source: migrated(constitution.md) -->
   **Status**: adopting

3. **All Git command execution uses parameterized `spawn()` — never shell string concatenation.** All HTML output is escaped. CSP headers use SHA-256 hashes for inline scripts; no `unsafe-inline`.
   <!-- source: migrated(constitution.md) -->
   **Status**: adopting

4. **Only make changes that are directly requested or clearly necessary.** No over-engineering, no speculative features — YAGNI.
   <!-- source: migrated(constitution.md) -->
   **Status**: adopting

5. **Metric names must reflect what is actually measured** (`commitTimePattern` not `workingHours`, `reviewWorkflowDetection` not `codeReviewCoverage`). Every metric includes a `limitations` object.
   <!-- source: migrated(constitution.md) -->
   **Status**: adopting

## Provenance

Migrated from `.documentation/memory/constitution.md` (v1.5.0, ratified 2026-02-20, last amended 2026-04-05). Full amendment history carried forward to `bold-docs/system/constitution-history.md`. Non-principle content (Technology Stack, Development Workflow, Quality Gates) carried forward to `bold-docs/system/tech-stack.md`.
