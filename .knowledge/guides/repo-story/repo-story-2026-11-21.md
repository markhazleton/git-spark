# Repository Story: git-spark

> Generated 2026-11-21 | Window: 12 months (2025-11-21 → 2026-11-21) | Scope: full

## Executive Summary

git-spark is a command-line tool and Node.js library that turns a Git repository's commit history into analytics reports (interactive HTML, JSON, CSV, and Markdown). It is written in TypeScript, published to npm as `git-spark`, and documented on a public site at git-spark.makeboldspark.com. The repository holds 219 commits since its first commit on 2025-09-29, 418 days of history. Over the last 12 months it received 120 commits.

The project ships often. In the 12-month window it cut 12 tagged versions, from v1.0.263 (2025-11-21) to v2.0.1 (2026-10-20), including two major milestones: v1.2.0 (an interactive `git-spark init` wizard) and v2.0.0 (Node.js 26 and the TypeScript 7 compiler). Work arrives in bursts tied to releases rather than as a steady flow. March 2026 was the busiest month with 31 commits, while June 2026 had none and September 2026 had one.

Engineering discipline is strong for a small project. 106 of 120 commits (88%) follow the Conventional Commits format, and every change runs through a pre-commit hook that lints and executes the test suite. CI covers 3 operating systems × 2 Node.js versions, plus CodeQL, a dependency review, and a security audit. In the last month, release publishing was hardened: npm publishes now also create GitHub Releases and open an issue on failure.

The main business risk is concentration. Every human commit in the window comes from a single developer, so the project's continuity depends on one person. The remaining 14 commits come from automation: 10 from the documentation-update workflow and 4 from Dependabot.

## Technical Analysis

### Development Velocity

Commits per month in the window (`timeline.commits_by_month`):

| Month | Commits | Month | Commits |
|---|---|---|---|
| 2025-11 (from the 21st) | 10 | 2026-05 | 20 |
| 2025-12 | 10 | 2026-06 | 0 |
| 2026-01 | 3 | 2026-07 | 10 |
| 2026-02 | 3 | 2026-08 | 2 |
| 2026-03 | 31 | 2026-09 | 1 |
| 2026-04 | 10 | 2026-10 | 15 |
| | | 2026-11 (to the 21st) | 5 |

- **Trend:** 67 commits in the first six months (Nov–Apr) and 53 in the last seven (May–Nov). Pace is broadly flat to slightly declining, with long quiet stretches between release pushes.
- **Release-day clustering:** much of the work lands on release days. 16 of March's 31 commits fell on 2026-03-14 (v1.3.0), 12 of May's 20 on 2026-05-19 (v1.3.1, v1.3.2), and all 15 of October's on 2026-10-20 (v2.0.0, v2.0.1).
- **Line volume** (from `git log --numstat`, which the context script does not report): 133,175 lines added and 84,388 removed across the window. Most of that volume is framework and documentation files (Markdown alone accounts for 1,124 touched files in `volume_metrics.file_types_top`). Restricted to `src/` and `test/`, the window added 9,083 lines and removed 11,431. That **net reduction of 2,348 lines** points to consolidation and refactoring rather than greenfield growth, consistent with the 2026-08-10 GitAnalyzer refactor and the removal of unimplemented CLI flags in 1.4.0.

### Contributor Dynamics

`contributor_census` lists five roles. Matching them against author identities shows the real shape of the team:

| Role | Commits | Identity |
|---|---|---|
| Lead Architect | 99 | Primary developer |
| Developer A | 10 | GitHub Actions docs-update workflow (bot) |
| Developer B | 4 | Dependabot (bot) |
| Developer C | 4 | Same author name as Lead Architect, different email |
| Developer D | 3 | Same author name as Lead Architect, different email |

- **One human contributor** made all 106 human commits (99 + 4 + 3). Automation made the other 14.
- **Bus factor: 1.** The top identity alone holds 82.5% of commits (99/120). Counting all of that person's identities, the figure is 100% of human commits.
- **No team growth** in the window. The bots' share has stayed steady because they are triggered by releases and dependency updates.

### Quality Signals

- **Tests:** 24 test files cover 44 non-test TypeScript source files, a 0.55 test-to-source file ratio. The context script's `test_metrics.test_file_count` of 498 counts files touched across history, not current test files, so it is not used here.
- **Coverage gates:** Jest enforces global thresholds of branches ≥75%, functions ≥87%, and lines ≥86% (from the Jest configuration in `package.json`). Current coverage is 78.9% branches, 93.78% functions, and 94.12% lines.
- **Test-related commits:** 15 of 120 commits (`test_metrics.test_related_commit_count`). Because the pre-commit hook runs the full suite on every commit, tests run far more often than this number suggests.
- **Commit messages:** 106 conventional commits and 0 informal ones (`commit_message_metrics`). By type (`change_patterns.subject_type_estimates`): docs 30, fixes 25, features 21, chore 19, CI/build 8, other 7, refactor 5, tests 5.

### Governance & Process Maturity

- **PR workflow:** `governance_maturity` reports 1 merged PR because it counts merge commits, but this repository squash-merges. Commit subjects in the window reference 8 PRs: #3, #4, #7, #8, #12, #15, #16, #17. Most of the 120 commits went straight to `main`, and PRs are used for larger or riskier changes such as dependency updates, CI security changes, and framework migrations.
- **Tag discipline:** 12 tags in the window, all following `vX.Y.Z` except `v1.0.262a`, which predates the window. The context script reported 0 tags (`milestones.tags: []`), and tags were read from `git for-each-ref` instead.
- **Release automation:** tag pushes run `publish.yml`, which tests, builds, and publishes to npm with provenance, then creates a GitHub Release from `CHANGELOG.md`. A failed publish opens an issue. This was added after the v1.4.0 publish failed unnoticed with an npm authentication error, which left 1.4.0 tagged but never published.
- **Constitution:** present at `.knowledge/governance/constitution.md`, with 5 principles (1 enforced, 4 adopting). It carries no version number; history lives in Git.

### Architecture & Technology

- **Languages** (`technical_signals.language_presence`): TypeScript (the product), JavaScript (build and docs scripts), and PowerShell, Bash, and Python (the DevSpark process tooling under `.devspark/`).
- **Configuration maturity:** `package.json` with Node.js ≥26, an ESLint flat config, Prettier, husky git hooks, `.gitattributes` line-ending rules, Dependabot, and five GitHub Actions workflows (CI, CodeQL, publish, security, docs update). The context script reports a Dockerfile, but none is tracked in the repository.
- **Toolchain:** TypeScript 7 compiles the product, while TypeScript 6 stays in place for ESLint, Jest (ts-jest), and TypeDoc.
- **Process tooling:** the repository moved through three planning frameworks in the window: Speckit to DevSpark, DevSpark to Bold (#12, 2026-07-09), and back to DevSpark (9.2.0 on 2026-10-20, then 9.6.0 on 2026-11-21). Hotspots under `.devspark/` reflect those migrations, not product work.

## Change Patterns

Top five most-modified files (`change_patterns.hotspots`):

1. **`package.json` (38 changes)** and **`package-lock.json` (36):** dependency updates, version bumps on every release, and script changes. This is expected for an npm package that releases often and takes Dependabot updates.
2. **`docs/index.html` (26):** the public landing page. Part of this count is mechanical: the `postbuild` script rewrites its "Published" date on every build, and the pre-push hook runs a build, so routine pushes touch it.
3. **`docs/performance-tuning.md` (16):** almost entirely the same automatic date stamp. Its churn does not reflect content work.
4. **`README.md` (15):** each feature release updates the documentation. The README commit history follows the feature timeline: init wizard, periods command, Node.js 22 to 26.
5. **`docs/git-spark-report.html` (15):** the sample report, regenerated by the docs workflow on every release tag (most of Developer A's commits).

**Source hotspots** (restricted to `src/` and `test/`): `src/cli/commands.ts` (9), `src/utils/validation.ts` (8), `src/output/html.ts` (8), `src/core/analyzer.ts` (8), `src/types/index.ts` (7). New features enter through the CLI and its validation layer, and the HTML exporter changes with each new report capability. `src/output/html.ts` is also security-sensitive (CSP and escaping), which makes it the file where churn matters most.

**Directory pattern:** the most-changed paths are dominated by `docs/`, `.github/`, and framework directories rather than `src/`. Product code changed in a focused set of about 8 files, while process, documentation, and release infrastructure absorbed most of the churn.

## Milestone Timeline

Tags in the window, from `git for-each-ref refs/tags` (the context script returned none):

| Date | Tag | Description |
|---|---|---|
| 2025-11-21 | v1.0.263 – v1.0.266 | Four tags in one day: package converted from CommonJS to ESM, CI fixes, security policy, and the docs-update workflow |
| 2025-12-14 | v1.0.268 | Dependency updates and file-extension exclusion |
| 2026-01-25 | v1.2.0 | `git-spark init` interactive configuration wizard |
| 2026-03-14 | v1.3.0 | Analysis and reporting utilities; Azure DevOps remnants removed |
| 2026-05-19 | v1.3.1, v1.3.2 | Publish-workflow fixes (registry URL, auth token, bash syntax) |
| 2026-07-11 | v1.4.0 | `git-spark periods` sprint comparison. Tagged but **never published to npm** (publish auth failure); shipped in 2.0.0 |
| 2026-10-20 | v2.0.0 | **Breaking:** Node.js 26 minimum; compiled with TypeScript 7 |
| 2026-10-20 | v2.0.1 | `--days` timezone fix; npm install-script warning removed |

Velocity spikes around releases: the busiest days in March, May, and October are the v1.3.0, v1.3.x, and v2.0.x release days. Activity falls off sharply after each release, most visibly with no commits in June and one in September after the May and July releases.

## Constitution Alignment

How well does the commit history reflect the five principles in `.knowledge/governance/constitution.md`?

| Principle | Status | Evidence in history | Alignment |
|---|---|---|---|
| 1. Never fabricate metrics that Git cannot support | enforced | Commit history cannot verify metric honesty. The 1.4.0 removal of unimplemented `--compare`/`--watch` flags is consistent with not advertising what the tool cannot do. | Cannot measure from history |
| 2. Tests first, with coverage thresholds | adopting | Coverage thresholds are enforced and currently exceeded; the pre-commit hook runs the suite on every commit. Only 15 of 120 commits are test-related, and history cannot show whether tests came before the code. | Strong on gates; test-first not measurable |
| 3. Parameterized `spawn()`, escaped HTML, CSP hashes | adopting | `src/output/html.ts` is a top source hotspot (8 changes) with its own CODEOWNERS entry. Whether each change kept to the rule is not visible in metadata. | Cannot measure from history |
| 4. Only directly requested or clearly necessary changes | adopting | The net reduction of 2,348 lines in `src/` and `test/` and the removal of dead CLI flags point toward simplification. | Good |
| 5. Metric names reflect what is measured; every metric has `limitations` | adopting | Not observable in commit metadata. | Cannot measure from history |

Main gap: three of the five principles concern code content that commit metadata cannot measure. Checking them needs a code-level review such as `/devspark-site-audit`.

## Developer FAQ

### What does this project do?

git-spark analyzes a Git repository's commit history and produces reports on contributor activity, commit patterns, file churn, and period-over-period comparisons. Reports come out as interactive HTML (with CSP-hashed inline scripts), JSON, CSV, Markdown, or console output. It works both as a global CLI (`git-spark`) and as a library imported from `src/index.ts`.

### What tech stack does it use?

TypeScript compiled by TypeScript 7 (`typescript7`), running on Node.js 26 or newer as ESM-only modules. The CLI uses `commander`, with `ora`, `chalk`, `boxen`, and `table` for terminal output, and `semver` for version handling. Tooling is Jest 30 with ts-jest, ESLint, Prettier, TypeDoc, and husky. CI runs on GitHub Actions.

### Where do I start?

Start with `src/cli/commands.ts`, the most-changed source file (9 changes), where every CLI command is defined. From there, follow `src/core/analyzer.ts` (the analysis engine, 8 changes) and `src/output/html.ts` (the HTML report, 8 changes). `src/types/index.ts` holds the shared types, and `src/utils/validation.ts` validates CLI options.

### How do I run it locally?

Use Node.js 26 or newer (see `.nvmrc`). Run `npm install`, then `npm run build`, which generates `src/version.ts` through `prebuild` and compiles to `dist/`. Run the CLI with `node bin/git-spark.js` (for example `node bin/git-spark.js health`), or build and run in one step with `npm run dev`. Note that every build also rewrites the date stamps in `docs/index.html` and `docs/performance-tuning.md`. Revert those files if you didn't intend to change them.

### How do I run the tests?

Run `npm test` for the Jest suite: 24 test files under `test/`, about 339 tests. Run `npm run test:coverage` to enforce the thresholds (branches 75%, functions 87%, lines 86%). The husky pre-commit hook runs lint and the full suite automatically. On Windows, if a suite fails with a jest cache `rename` error, run `npx jest --clearCache` and retry.

### What is the branching/PR workflow?

Most commits go straight to `main` as conventional commits. Larger changes go through squash-merged PRs: 8 PRs are referenced in the window, including #15–#17 this month. Dependabot opens dependency PRs. Releases are cut with `npm run release:patch|minor|major`, which bumps the version, promotes the CHANGELOG `[Unreleased]` section, regenerates the docs changelog page, and pushes the tag that triggers `publish.yml`.

### Who do I ask when I'm stuck?

The Lead Architect, who made 99 of 120 commits in the window and every human commit. File questions through GitHub Issues. Changes under `src/core/`, `src/cli/`, `src/output/html.ts`, and `.github/workflows/` have a code owner listed in `.github/CODEOWNERS`.

### What areas of the code change most often?

In product code: `src/cli/commands.ts` (9 changes), then `src/utils/validation.ts`, `src/output/html.ts`, and `src/core/analyzer.ts` (8 each). Outside `src/`, `package.json` (38) and `package-lock.json` (36) change most, driven by releases and dependency updates.

### Are there coding standards I must follow?

Yes. Use Conventional Commits (88% of commits already do), ESLint (`npm run lint`), and Prettier (`npm run format`) on `src/**/*.ts`, with LF line endings set by `.gitattributes`. The constitution adds project rules: no metric Git cannot support, parameterized `spawn()` for Git, escaped HTML with CSP hashes, minimal scope, and metric names that match what they measure.

### What version is currently released?

v2.0.1, tagged and published to npm on 2026-10-20, with the `--days` timezone fix and removal of the npm install-script warning. Unreleased work on `main` since then includes dependency updates (`ora` 10), the CI security-audit change, the docs changelog page, and automatic GitHub Releases, all recorded under `[Unreleased]` in `CHANGELOG.md`.

---

Generated by /devspark-repo-story | DevSpark v9.6.0 — Adaptive System Life Cycle Development
