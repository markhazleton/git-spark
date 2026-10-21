# git-spark 2.0.1 — 2026-10-20

## Release Notes

### Fixed

- `--days` could silently report fewer commits (even zero) when the window reached back past the
  repository's first commit and the local date differed from the UTC date, such as in US evenings.
  The start of the window is now passed to git as a full UTC timestamp.
- `npm install -g git-spark` no longer prints "install scripts blocked because they are not
  covered by allowScripts". The package no longer ships a `postinstall` script; contributor
  git-hook setup now runs from `prepare`, which npm never runs for registry installs.
- The docs site sample report covers the last 365 days. The previous 30-day window, ending at the
  UTC date, could render an empty report when generated just after midnight UTC.

No CLI flag, API, or runtime-requirement changes. Node.js 26.0.0 or newer is still required.

## Operational Summary

- **Release window**: `v2.0.0..HEAD` (5 commits) plus the release commit.
- **Version**: 2.0.0 → 2.0.1 (patch: a collector date fix, packaging, and docs workflow).
- **Regression test**: `test/collector-regression.test.ts` asserts `--days` returns the same
  commits as an unbounded run and that the capped start is a full ISO timestamp; it fails without
  the fix.
- **Gates**: lint, build, full `npm audit --audit-level=moderate` clean, Jest 338/338 (pre-commit),
  knowledge index current with no coverage gaps or dangling references, no planning references.
- **Verification of the fix**: npm 12.2.0 enumerates `prepare` only for non-registry sources
  (`@npmcli/arborist/lib/install-scripts.js`), so registry installs report no blocked scripts.
- **Archived**: nothing; no completed planning bundles in the window. No manifest written.
- **Retention sweep**: no `pr-review/`, `audit/`, `metrics/`, or `telemetry/` work products present.
- **Left for a decision** (unchanged, owner keeps in place): `.devspark.work/migrations/` and
  `.devspark.work/mark-hazleton/`.
- **Publication**: tag `v2.0.1` triggers `publish.yml` (`npm publish --provenance`) and
  `update-docs.yml` (365-day sample report built from the tagged source).
