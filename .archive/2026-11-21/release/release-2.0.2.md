# Release 2.0.2

- **Version**: 2.0.2 (patch)
- **Cut date**: 2026-11-21
- **Window**: `v2.0.1` (`14768ad`) → `8ea86fd`, 6 commits
- **Tag**: `v2.0.2`, annotated, on the release commit

## Release notes

### Added

- Release history page on the docs site (`docs/changelog.html`), generated from CHANGELOG.md and linked from the landing page
- GitHub Releases are now created automatically after a successful npm publish, using that version's CHANGELOG.md section as the release notes

### Changed

- Updated dependencies, including `ora` 10 (CLI spinners)
- CI security audit: `npm audit` now checks production dependencies only, while `audit-ci` audits everything with an allowlist for two dev-only advisories that have no upstream fix yet (GHSA-3g3m-2fjr-6pw4 in glob, GHSA-g3hv-75wg-m249 in minimatch)
- A failed npm publish now opens a GitHub issue instead of only logging a message

### Fixed

- README "Repo Story" link pointed at a file that no longer exists; it now links to a current repository story

## Version classification

Patch. No `src/` or `test/` files changed in the window. The changes are dependency updates, CI and release automation, documentation and site content, and DevSpark framework files (9.2.0 → 9.6.0).

## Verification

- Lint: clean
- Build: TypeScript 7 compile passes
- Tests: 24 suites, 339 tests pass; coverage 79.51% branches, 94.38% functions, 94.52% lines, all above thresholds
- Package: `npm pack --dry-run` (177 files) and `publint` pass
- Knowledge: `build_knowledge_index.py --check` passes; knowledge-scope site audit found no KNOW1–KNOW9 findings
- Planning identifiers: none in `src/`, `test/`, or `.knowledge/`

## Archive summary

Manifest: `.archive/2026-11-21/release/archive-manifest-2.0.2.json` (validated `OK`, 1 file)

| Original | Archived |
|---|---|
| `.devspark.work/audit/2026-11-21_results.md` | `.archive/2026-11-21/audit/2026-11-21_results.md` |

There were no completed spec bundles or quickfix records to archive, nothing in flight, and no orphaned bundles.

## Left in place (decided)

- `.devspark.work/mark-hazleton/`: the owner's personal override folder. Kept by owner decision.
- `.devspark.work/migrations/2026-10-20-devspark.md`: the owner chose to archive it, but `release-archive` only moves categorized work areas. It stays until `.knowledge/taxonomy-registry.json` gives `migrations/` a lifecycle.

## Static content updated

- `docs/index.html`: version badge v2.0.2, published date November 21, 2026
- `docs/performance-tuning.md`: version 2.0.2+, last updated November 2026
- `docs/changelog.html`: regenerated with v2.0.2 as latest
- `docs/git-spark-report.html`: regenerated after publish by `update-docs.yml` and refreshed from the published `git-spark@2.0.2`
