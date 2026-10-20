---
type: governance
---

# Git Spark Constitution

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

Restored from the repository governance rules during the DevSpark migration on 2026-10-20. The five principles and their enforcement status are preserved. Amendment history is maintained in [constitution-history.md](constitution-history.md); runtime and quality gates are documented in [tech-stack.md](../reference/tech-stack.md).
