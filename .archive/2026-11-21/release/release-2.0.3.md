# Release 2.0.3

- **Date:** 2026-11-21
- **Window:** `v2.0.2` to `ea4f5e3` (8 commits, PRs #19 and #20)
- **Bump:** patch. Bug fixes and one security fix; no API or option changes.

## Delta

Fixed:

- `--path` accepts Git glob patterns (`src/**`, `src/core/*.ts`).
- `--branch` combined with `--path` analyzes the requested branch.
- The oldest commit in a window is no longer dropped when its message has a multi-line body.
- `git-spark validate` recognizes a Git repository again.
- `git-spark analyze` applies the global options (`--days`, `--format`, `--output`, `--path`, ...).
- Bus Factor shows `0%` instead of `NaN%` for an empty window.

Security:

- `git-spark html --serve` listens on `127.0.0.1` only and sends no wildcard CORS headers.

Also added: the DevSpark roadmap under `.devspark.work/roadmap/` (planning only, not shipped in the
package).

## Verification

| Gate | Result |
| ---- | ------ |
| ESLint | pass |
| Type-check (TypeScript 7) | pass |
| Jest | 25 suites, 350 tests pass; coverage 80.57% branches, 96.2% functions, 95.34% lines |
| Build | pass |
| publint | pass |
| `npm audit --omit=dev` | 0 vulnerabilities |
| audit-ci | pass (allowlisted dev-only GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249) |

## Knowledge audit (scope: knowledge)

| Check | Result |
| ----- | ------ |
| KNOW1 Knowledge builds (`build_knowledge_index.py --check`) | pass |
| KNOW2 Coverage gaps (`coverage.json`) | none |
| KNOW3 `source_of_truth` / `appliesTo` paths | none cited; nothing dangling |
| KNOW4 Relation and decision resolution | no entities; nothing unresolved |
| KNOW5 / KNOW6 Taxonomy and coverage | no taxonomy registry; module coverage in `architecture/overview.md` unchanged and still accurate |
| Knowledge integrity (`knowledge-integrity.py`) | 0 findings |

No `.knowledge/` content describes behavior changed in this window. The planning-identifier scan of
`src/`, `test/`, and `.knowledge/` found nothing.

## Archive

- Archived: nothing. No completed spec bundles, quickfix records, or swept work products.
- Retained: `.devspark.work/roadmap/` (no Prospective Spec complete or dropped).
- Left for a decision (unchanged from 2.0.2):
  - `.devspark.work/mark-hazleton/`: kept by the developer's earlier decision.
  - `.devspark.work/migrations/`: the developer chose to archive it. It needs a lifecycle in
    `.knowledge/taxonomy-registry.json` before the archive script can move it.

Manifest: `.archive/2026-11-21/release/archive-manifest-2.0.3.json` (0 files moved; `validate`
reports OK).
