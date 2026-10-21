# git-spark 2.0.0 — 2026-10-20

## Release Notes

### Breaking

- Node.js 26.0.0 or newer is now required (previously 22.22.2). Upgrade Node before installing
  2.0.0; `npm install` on an older runtime fails the `engines` check.

### Changed

- Compiled with TypeScript 7; tooling (ESLint, Jest, TypeDoc) keeps the TypeScript 6 API.
- Stronger typing for author and file metrics in the analyzer, safer regex validation, and
  improved collector error handling.
- devDependencies updated to current releases.

### Security

- GHSA-hp3w-g68c-fv3c (`sprintf-js` DoS, no upstream fix) removed from the dev toolchain by
  overriding `argparse` to 2.x under `js-yaml@3`. The published package was never affected.

No runtime API or CLI flag changes beyond the Node.js requirement.

## Operational Summary

- **Release window**: `v1.4.0..43616f5` (12 commits) plus the release commit.
- **Version**: 1.4.0 → 2.0.0 (major: Node.js runtime requirement raised).
- **Gates**: lint, build, `npm pack --dry-run` (177 files), Jest 338/338 with coverage thresholds,
  full `npm audit --audit-level=moderate` and `audit-ci --moderate` clean, CI/Security/CodeQL green
  on `main` at `43616f5`.
- **Knowledge**: index current, no coverage gaps, no dangling references, no planning references
  in shipped code or `.knowledge/`. Knowledge-scope audit raised one KNOW6 coverage gap (no doc for
  the core pipeline), closed by adding `.knowledge/architecture/overview.md`. The constitution
  amendment ledger was removed from `.knowledge/` (Git holds that history).
- **Archived**: 2 completed spec bundles, 6 files — journaled in
  `archive-manifest-2.0.0.json` (this folder); `release-archive validate` reports OK.
- **Retention sweep**: no `pr-review/`, `audit/`, `metrics/`, or `telemetry/` work products present.
- **Left for a decision** (owner chose to keep in place): `.devspark.work/migrations/` (framework
  migration report) and `.devspark.work/mark-hazleton/` (personal README). Both are uncategorized
  work areas with no taxonomy lifecycle (`.knowledge/taxonomy-registry.json` does not exist).
- **Publication**: tag `v2.0.0` triggers `.github/workflows/publish.yml` (`npm publish --provenance`).
