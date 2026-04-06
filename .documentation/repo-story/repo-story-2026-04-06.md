# Repository Story: git-spark

> Generated 2026-04-06 | Window: 12 months | Scope: full

---

## Executive Summary

git-spark is a TypeScript-based developer tool that analyzes Git repository history and generates rich, self-contained analytics reports — commit patterns, contributor dynamics, code churn, governance health — delivered as interactive HTML pages, JSON, Markdown, or console output. It is published to npm as `git-spark` and live-demos its own output at [https://markhazleton.github.io/git-spark/](https://markhazleton.github.io/git-spark/).

In 188 days of active development — from first commit on 29 September 2025 through 5 April 2026 — the project accumulated **162 commits** across **13 released versions**, from v1.0.156 through v1.3.0. That cadence represents roughly one commit every 1.2 days, a pace consistent with a focused, solo-architect project advancing rapidly toward a stable public release.

Velocity showed a characteristic burst-then-consolidate pattern. The project opened with three high-intensity months (Sep: 38, Oct: 37, Nov: 34), then deliberately slowed through December–February (10→3→3 commits) before a resurgence of 31 commits in March 2026 as v1.3.0 shipped. This shape — intense greenfield burst, winter consolidation, spring stabilization push — is a healthy sign of a project that matured through iteration rather than stalling.

Governance indicators are strong. **78% of commits use Conventional Commits format** (126/162), enabling automatic CHANGELOG generation and semantic versioning. Thirteen tagged releases in six months demonstrate disciplined delivery rhythm. A near-zero merge commit rate (1 in 162, or 0.6%) signals a streamlined, trunk-based workflow that keeps the history linear and readable.

The current stable release is **v1.3.0** (2026-03-14), which introduced repository health scoring, team collaboration analysis, code quality metrics, timeline visualization, bus factor calculation, and a security-hardened HTML delivery pipeline. The npm package is published with provenance attestation via GitHub Actions.

---

## Technical Analysis

### Development Velocity

The 12-month window shows a clear three-phase arc:

| Month | Commits | Phase |
| ----- | ------- | ----- |
| 2025-09 | 38 | Greenfield burst |
| 2025-10 | 37 | Feature construction |
| 2025-11 | 34 | Hardening & publishing |
| 2025-12 | 10 | Stabilization |
| 2026-01 | 3 | Low-cadence maintenance |
| 2026-02 | 3 | Constitution & governance |
| 2026-03 | 31 | v1.3.0 sprint |
| 2026-04 | 6 | Post-release tooling |

**Phase 1 (Sep–Nov 2025):** 109 commits in 90 days — rapid feature construction. The HTML exporter, CLI, JSON/Markdown exporters, export charts, dark mode, and initial npm publishing all landed in this window.

**Phase 2 (Dec 2025–Feb 2026):** 16 commits in 90 days — deliberate slow-down. Security policy added, file extension exclusion shipped, `init` command introduced, and the project constitution ratified (v1.0.0 → v1.1.0). This is not stagnation; it is discipline.

**Phase 3 (Mar 2026):** 31 commits in 14 active days — the v1.3.0 release sprint. Azure DevOps integration removed (scope simplification), analysis utilities added, CodeQL alerts resolved, ESLint upgraded to v10, TypeScript upgraded to 6.0.2, and CSS refactored into an extracted module.

**Post-release (Apr 2026):** 6 commits — DevSpark framework migration, constitution amendments, harvest workflows. Infrastructure investment after the release.

By commit subject type: `feat` (62), `fix` (32), `docs` (21), `chore` (12), `test` (8), `refactor` (7), `ci` (6). The feat-to-fix ratio of roughly 2:1 is healthy for a project of this age.

### Contributor Dynamics

| Role | Commits | Share |
| ---- | ------- | ----- |
| Lead Architect | 155 | 95.7% |
| CI Bot (github-actions) | 4 | 2.5% |
| Dependency Bot (dependabot) | 3 | 1.9% |

This is a **solo-architect project** at the current stage. The Lead Architect authored 155 of 162 commits. The 4 bot commits are automated docs-site updates triggered by release tags; the 3 dependabot commits are automated dependency security patches.

**Bus factor: 1.** All institutional knowledge and decision-making authority rests with one person. This is appropriate for a focused open-source tool at this stage, but worth noting for any organization that adopts git-spark in a critical workflow — a single point of contributor risk exists.

No team growth or contraction is visible in the timeline; this is a solo project that has not yet onboarded external contributors.

### Quality Signals

- **Test-to-source file ratio:** 19 test files / 31 source files = **61%** — a strong signal for a TypeScript library. Full coverage is verified on every CI run.
- **Test framework:** Jest with ts-jest. Coverage enforced via `npm run test:coverage` on Node 20 and 22 across Ubuntu, Windows, and macOS.
- **Conventional commit adoption:** 126/162 = **77.8%**. A clear majority of commits follow the standard; the non-conforming 22% are mostly early commits and quick fixes predating the convention's adoption.
- **Commit message quality:** Subjects are descriptive and actionable. The prefix distribution (feat, fix, docs, chore, ci) matches a mature open-source workflow. No obvious message-quality regressions in recent commits.
- **Coverage thresholds enforced by constitution:** branches ≥75%, functions ≥87%, lines ≥86%.

### Governance & Process Maturity

- **Merge commit rate: 0.6%** (1 of 162). This project operates trunk-based: the Lead Architect commits directly to `main` with occasional PR merges (1 confirmed PR-based merge visible). This is an appropriate choice for a solo maintainer.
- **Tag discipline:** 13 releases in 188 days — roughly one release every 2 weeks at peak cadence. Release versions jump from v1.0.x (patch increment) to v1.2.0 then v1.3.0, reflecting intentional semantic versioning as the public API stabilized.
- **CI maturity:** Four GitHub Actions workflows active — CI (test matrix on 3 OS × 2 Node versions), CodeQL (security), Security audit (weekly), and Publish (NPM provenance). This is CI coverage appropriate for a published npm package.
- **Constitution:** The project has a formal development constitution at `.documentation/memory/constitution.md`, now at v1.5.0. Constitution amendments are tracked as CAP proposals with impact reports — a governance pattern unusual for a solo project and indicative of future-proofing for team growth.

### Architecture & Technology

**Language stack:** TypeScript (strict, `noImplicitAny`, `exactOptionalPropertyTypes`) on Node.js 20+, compiled with `tsc`. Support scripts in PowerShell and Bash. GitHub Pages site in HTML.

**Module resolution:** `bundler` mode — all imports require explicit `.js` extension.

**Key dependencies:** Commander.js (CLI), chalk + boxen (terminal output), date-fns (date manipulation), glob (file matching). No external chart libraries — all charts are native SVG, which produces offline-capable, zero-dependency HTML reports.

**Configuration maturity:** `tsconfig.json` (strict), `eslint.config.cjs` (ESLint v10 + @typescript-eslint), `.npmignore`, `.gitignore`, `.git-spark.json` (self-analysis config). A `SECURITY.md` governs responsible disclosure.

**Architecture pattern:** Clean separation between core analysis (`src/core/`), output formatters (`src/output/`), CLI (`src/cli/`), types (`src/types/`), and utilities (`src/utils/`). Each formatter is independently testable; the core analyzer is the primary complexity hotspot.

---

## Change Patterns

### Top 5 Hotspot Files

| Rank | File | Changes | Interpretation |
| ---- | ---- | ------- | -------------- |
| 1 | `package.json` | 77 | Version bumps + dependency churn — expected for a frequently-released library |
| 2 | `package-lock.json` | 64 | Lockfile in sync with package.json churn; expected |
| 3 | `src/output/html.ts` | 32 | Most complex formatter — SVG charts, dark mode, CSP, accessibility |
| 4 | `src/core/analyzer.ts` | 27 | Heart of the analysis engine; frequent refinement of metrics |
| 5 | `README.md` | 21 | Active public-facing docs — kept current with each release |

**Key observations:**

- `src/output/html.ts` (32 changes) is the **primary complexity hotspot** in source code. Constitution v1.4.0 grandfathered this file for remediation tracking at 820 lines — it exceeds the 500-line SHOULD NOT threshold and is a candidate for decomposition in a future sprint.
- `src/core/analyzer.ts` (27 changes) is the second complexity hotspot. At 27 changes over 188 days, this file is in active, continuous refinement — expected behavior for the core metric calculation engine.
- `src/cli/commands.ts` (19 changes) reflects an evolving CLI surface. New commands, flags, and option combinations are actively landing.
- The test directory shows parallel evolution: `test/html-exporter.test.ts` (18), `test/validation.test.ts` (12), `test/index.test.ts` (9) — tests move with implementation, confirming TDD discipline.
- `docs/index.html` (16 changes) and `docs/git-spark-report.html` (11 changes) are CI-generated GitHub Pages artifacts — they are updated automatically on release, not manually edited.

**Directory-level pattern:** Changes concentrate heavily in `src/` (core library) and `test/` (coverage), with supporting activity in `docs/` (CI-generated), `.github/` (CI workflows), and `.documentation/` (governance). This is the expected shape for a maturing library.

---

## Milestone Timeline

| Date | Tag | Event |
| ---- | --- | ----- |
| 2025-10-07 | v1.0.156 | First published release — HTML, JSON, Markdown exporters live |
| 2025-10-07 | v1.0.173 | Fast follow — CLI and chart enhancements |
| 2025-10-10 | v1.0.213 | GitIgnore enhancements; public pages demo |
| 2025-10-13 | v1.0.221 | Repository cleanup; stable CLI surface |
| 2025-11-20 | v1.0.262 | Security policy; npm trusted publishing setup |
| 2025-11-20 | v1.0.262a | Hotfix |
| 2025-11-21 | v1.0.263–266 | Four rapid provenance/publishing fixes in one day |
| 2025-12-14 | v1.0.268 | File extension exclusion; dependency updates |
| 2026-01-25 | v1.2.0 | `git-spark init` command; config wizard; MINOR bump signals API stability |
| 2026-03-14 | v1.3.0 | Repository health scoring, team analysis, bus factor, CSS extraction, CodeQL clean |

**Milestone arc:** Rapid v1.0.x iteration (7 tags in 44 days) drove the tool to a stable publishable state. The jump to v1.2.0 on 2026-01-25 marked the first intentional MINOR version, signaling a stable public API. v1.3.0 on 2026-03-14 is the current stable release, delivered after a 31-commit sprint that cleaned up technical debt, resolved security findings, and hardened the architecture.

The velocity data confirms the release pattern: commits peaked before the v1.0.x tags (109 commits Sep–Nov), held steady before v1.2.0 (3 commits in January), then spiked again before v1.3.0 (31 commits in March). Each release is preceded by focused delivery activity.

---

## Constitution Alignment

The project constitution (v1.5.0) defines five core principles. Here is how the commit history maps to each:

| Principle | Constitution Mandate | Evidence from History | Alignment |
| --------- | -------------------- | --------------------- | --------- |
| Never fabricate metrics | All metrics have derivable data sources | Analyzer refactored multiple times to remove subjective metrics ("Refactor GitSpark to Eliminate Subjective Metrics" — 2025-09-30) | Strong |
| Test-First (TDD) | Coverage ≥75% branches, ≥87% functions, ≥86% lines | 19 test files; tests co-evolve with source in 8+ test commits; CI enforces coverage on every push | Strong |
| Security-First | Git ops via `spawn()`, escaped HTML, CSP SHA-256 | "fix: resolve all open CodeQL security scan alerts" (2026-03-14); security policy (2025-11-21); CSP in HTML exporter | Strong |
| Simplicity (YAGNI) | Only changes directly requested or necessary | Azure DevOps integration removed (2026-03-14) — scope reduction is a first-class signal of YAGNI discipline | Strong |
| Honesty | Metric names reflect what is measured | Multiple commits titled "improve objectivity" and "eliminate subjective metrics" are direct evidence | Strong |

**Gap:** The constitution's module size guideline (files ≤500 lines SHOULD NOT; ≤1,000 MUST NOT) has two grandfathered files — `html-styles.ts` (820L) and `html-daily-trends.ts` (817L) — that need tracked remediation issues before the next major refactor sprint. The `src/output/html.ts` file (also oversized, grandfathered at v1.2.0) remains an open obligation.

**Overall:** The commit history is a faithful expression of the stated constitution. The governance signal is exceptionally strong for a solo project.

---

## Developer FAQ

### What does this project do?

git-spark analyzes a Git repository's commit history and produces structured analytics reports covering contributor patterns, code churn, governance health, and timeline trends. Reports are generated as interactive HTML (with native SVG charts, dark mode, and data export), JSON, Markdown, CSV, or console output. The project is a published npm package (`git-spark`) and also serves as a live demo of its own output via GitHub Pages.

### What tech stack does it use?

TypeScript (strict mode, Node.js 20+) compiled with `tsc` in `bundler` module resolution mode. CLI via Commander.js. Output formatting uses native SVG (no Chart.js dependency), chalk, boxen, and date-fns. Testing uses Jest with ts-jest across Node 20 and 22 on Ubuntu, Windows, and macOS. GitHub Actions handles CI, CodeQL scanning, security audits, and npm publishing with provenance.

### Where do I start?

Start with [README.md](../../README.md) for install and usage. The core entry point is [src/index.ts](../../src/index.ts) (11 changes), which exports the public API. The CLI entry is [src/cli/commands.ts](../../src/cli/commands.ts) (19 changes). For analysis logic, [src/core/analyzer.ts](../../src/core/analyzer.ts) (27 changes) is the primary engine. For HTML output, [src/output/html.ts](../../src/output/html.ts) (32 changes) is the most complex module.

### How do I run it locally?

```bash
npm run prebuild      # generate src/version.ts
npm run build         # clean + tsc compile
node bin/git-spark.js --help
```

Or install globally from local: `npm pack && npm install -g git-spark-*.tgz`. Always run `npm run prebuild` before `npm test` or `npm run build` — this generates the version file that the build depends on.

### How do I run the tests?

```bash
npm run prebuild       # required before tests
npm test               # jest
npm run test:coverage  # jest --coverage (enforced thresholds: branches 75%, functions 87%, lines 86%)
```

Tests live in `test/` — 19 test files covering every exporter, the core analyzer, CLI commands, validation, and git utilities. Tests run on a 30-second timeout per test. CI runs the full matrix on Node 20 and 22 across three operating systems.

### What is the branching/PR workflow?

Effectively trunk-based: the Lead Architect commits directly to `main`. Of 162 commits, only 1 is a merge commit (0.6%), corresponding to a single dependabot PR merged via GitHub UI. Feature development happens in short-lived branches if at all, with fast-forward merges keeping history linear. There is no formal PR review requirement for solo work; PRs appear primarily for automated dependency updates.

### Who do I ask when I'm stuck?

The Lead Architect authored 155 of 162 commits (95.7%) and is the sole human contributor. File an issue at [https://github.com/markhazleton/git-spark/issues](https://github.com/markhazleton/git-spark/issues) or check the constitution at `.documentation/memory/constitution.md` for architectural guidance.

### What areas of the code change most often?

The three highest-churn source files are `src/output/html.ts` (32 changes — the HTML report generator with SVG charts and CSP), `src/core/analyzer.ts` (27 changes — the core metric engine), and `src/cli/commands.ts` (19 changes — CLI command definitions). These are the most active development areas and the most likely places to find recent changes, open complexity, and breaking changes between versions.

### Are there coding standards I must follow?

Yes, enforced at multiple layers:

1. **Conventional Commits** — 78% adoption; all new commits should follow `feat:`, `fix:`, `docs:`, etc.
2. **TypeScript strict mode** — `noImplicitAny`, `exactOptionalPropertyTypes`; `npm run lint` via ESLint v10 + @typescript-eslint (`no-unsafe-any` rule).
3. **Module size** — new files SHOULD NOT exceed 500 lines; MUST NOT exceed 1,000 (constitution v1.5.0).
4. **Security** — all Git operations via `spawn()` with argument arrays; HTML output escaped; CSP SHA-256 hashes; no shell string concatenation.
5. **Test-First** — TDD mandatory; coverage thresholds enforced on CI.
6. **JSDoc** — all exported APIs must have JSDoc; decomposition PRs must include documentation sub-tasks.

The full governance document is at [.documentation/memory/constitution.md](../memory/constitution.md).

### What version is currently released?

**v1.3.0**, released 2026-03-14. This version introduced repository health scoring with actionable recommendations, team collaboration analysis, bus factor calculation, code quality metrics, timeline visualization, CSS refactoring (`html-styles.ts` extracted), and a clean CodeQL security scan. Published to npm with provenance via GitHub Actions trusted publishing.

---

*Generated by /devspark.repo-story | DevSpark v0.1.1 — Adaptive System Life Cycle Development*
