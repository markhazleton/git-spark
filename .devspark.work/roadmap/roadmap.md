# Roadmap: git-spark

## Direction

git-spark is a Git-only analytics CLI and library for maintainers and engineering leads. It turns
`git log` into reports a team can trust and share. Over the next few releases the outcomes that matter
are:

1. **Every number is right.** A metric is either derived correctly from Git or not shown
   (constitution principles 1 and 5).
2. **Every option does what it says.** A flag or config key either works or is removed.
3. **Reports are safe to share.** Redaction is complete, and the local report server does not expose
   repository data to the network.

Breadth (new metrics, new outputs) comes after these. Each item below ships on its own and leaves the
tool releasable.

## Current Baseline

Assessed on 2026-11-21 at `main` `6ec37fa` (git-spark 2.0.2 published, PR #19 merged, unreleased).

- **Collection** streams `git log --no-merges --numstat` with `\x1e`/`\x1f` separators
  (`src/core/collector.ts`). Since PR #19 the collector matches `git log` commit counts exactly,
  `--path` takes Git pathspec globs, and `--branch` combines with `--path`. These three fixes sit in
  CHANGELOG `[Unreleased]` waiting for 2.0.3.
- **Analysis** lives in one 2,597-line `src/core/analyzer.ts`. The HTML output was decomposed earlier
  (issues #5, #6, #9 closed); the analyzer was not.
- **Quality gates** pass: 345 tests, coverage 80.23% branches / 96.2% functions / 94.92% lines,
  production `npm audit` clean. Dependabot alert #75 is the allowlisted dev-only minimatch advisory
  (GHSA-g3hv-75wg-m249) in `audit-ci.jsonc`.
- **Code review (2026-11-21)** found the defects listed under Findings and the outcome-sized
  problems turned into Prospective Specs below. Evidence for each is in the PS or finding.

## Themes

Priority order. Lower `order` comes first within a theme.

- **Trustworthy numbers**
  - [ps-001 Accurate per-file change records](specs/ps-001-accurate-file-change-records.md)
  - [ps-002 Correct contributor identity](specs/ps-002-correct-contributor-identity.md)
  - [ps-003 Timezone-consistent day and hour buckets](specs/ps-003-timezone-consistent-buckets.md)
  - [ps-004 Exact date windows](specs/ps-004-exact-date-windows.md)
  - [ps-005 Accurate commit message scoring](specs/ps-005-accurate-commit-message-scoring.md)
- **Options that do what they say**
  - [ps-006 Complete, collision-free email redaction](specs/ps-006-complete-email-redaction.md)
  - [ps-007 Honor or retire inert options](specs/ps-007-honor-or-retire-inert-options.md)
  - [ps-008 Multiple and exclude path filters](specs/ps-008-multiple-and-exclude-path-filters.md)
- **Maintainability**
  - [ps-009 Decompose the analyzer](specs/ps-009-decompose-the-analyzer.md)

## Findings

Defects too small for a Prospective Spec. Each is independent and fits `/devspark-quickfix`.

| # | Severity | Defect | Evidence |
| - | -------- | ------ | -------- |
| F1 | High | `git-spark validate` always prints "Failed to validate Git repository": the dynamic import omits the `.js` extension, which ESM cannot resolve. | `src/cli/commands.ts:407`; reproduced with installed 2.0.2 |
| F2 | High | `html --serve` listens on every interface and sends `Access-Control-Allow-Origin: *`, exposing the report (names, emails, file paths) to the local network. Bind to `127.0.0.1` and drop CORS. | `src/cli/report-command.ts:202-227` |
| F3 | Medium | `git-spark analyze` ignores the global options (`--days`, `--format`, `--path`, ...) because it never merges `command.parent.opts()` the way `html` does. | `src/cli/commands.ts:152-158` |
| F4 | Medium | Bus Factor prints `NaN%` when the window has no commits (`busFactor / totalAuthors` with 0 authors). Appears in the CLI summary, health check, HTML command summary, and report `keyMetrics`. | `src/cli/commands.ts:469,507`, `src/cli/report-command.ts:138`, `src/core/analyzer.ts:1377` |
| F5 | Low | The streaming collector ignores `git log`'s exit code and stderr, so a failing `git log` yields a partial or empty report instead of an error. | `src/core/collector.ts:265-274` |
| F6 | Low | Finding the first commit date reads the entire `git log --all` into memory under a 60 s timeout; on very large repositories it times out and silently returns `null`, which disables range capping. `git log --all --max-parents=0` returns only root commits. | `src/utils/git.ts:212-232` |
| F7 | Low | On Windows, `--open` runs `cmd.exe /c start "" <path>`; an output path containing `&` or `^` is interpreted by `cmd`. The path is user-supplied, so impact is self-inflicted. | `src/cli/report-command.ts:281-284` |

## Planning Housekeeping

Open items carried over from other planning records, consolidated here:

- **Release 2.0.3** with the PR #19 fixes (CHANGELOG `[Unreleased]`). Release work, not a PS.
- **Article update**: after 2.0.3 ships, update the `--path` note in "Getting to Know Your Repository
  with git-spark" (https://claude.ai/artifact/CULQDaKVQDNo8oShqN3nXN), which says `**` globs do not
  work.
- **DevSpark migration record** (`.devspark.work/migrations/2026-10-20-devspark.md`): its work is
  complete. It stays in `.devspark.work/` because the release archiver needs a
  `.knowledge/taxonomy-registry.json` lifecycle entry to archive an uncategorized document. Adding that
  registry entry lets the next release archive it.
- **Docs date re-stamp**: `postbuild` (`scripts/update-docs-version.js`) rewrites dates in
  `docs/index.html` and `docs/performance-tuning.md` on every build, including the pre-push build,
  leaving the tree dirty after each push. Stamp only during release.
- **Dependabot #75**: allowlisted dev-only minimatch advisory; drop the allowlist entry when typedoc
  ships a fixed minimatch.

## Decisions

- **2026-11-21: One roadmap.** All planning lives in this roadmap. Durable decisions stay in
  `.knowledge/architecture/decisions.md`; the CHANGELOG records what shipped. Basis: the developer asked
  to consolidate planning into a single DevSpark roadmap.

## Delivered

None yet.
