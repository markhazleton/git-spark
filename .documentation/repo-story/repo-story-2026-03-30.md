# Repository Story: git-spark

> Generated 2026-03-30 | Window: 24 months | Scope: full

---

## Executive Summary

**git-spark** is an enterprise-grade Git repository analytics tool designed to analyze commit history and generate comprehensive HTML, JSON, CSV, Markdown, and console reports. Built on TypeScript and Node.js 20+, it operates from the command line and targets developers, engineering managers, and DevOps teams who want to understand their codebase evolution — honestly, without guessing at metrics that cannot be derived from Git data alone.

The project launched on September 29, 2025 and has delivered 151 commits across a 181-day history window through March 30, 2026. Development has been remarkably disciplined from day one: 76% of all commits follow the Conventional Commits specification, a formal project constitution was ratified within five months, and security hardening — including Content Security Policy, parameterized Git command execution, and input sanitization — was woven into the architecture from the start.

Velocity followed a classic project lifecycle curve. The first three months (September–November 2025) produced 109 commits — 72% of total output — as the tool's core architecture, multi-format export pipeline, and HTML report were built from scratch. Activity slowed significantly through December 2025 and into early 2026 (averaging 5 commits/month over December–February), suggesting a consolidation and stabilization phase. March 2026 delivered a strong resurgence with 26 commits, including a major release (v1.3.0), security remediation work, and the addition of the Spec Kit Spark governance framework.

Governance posture is mature for a project of this age. A project constitution exists at version 1.2.0 with two formal amendments recorded, covering type safety, testing thresholds, analytical integrity, layered architecture, and security requirements. The test suite enforces minimum coverage of 75% branches, 87% functions, and 86% lines — all verified on every commit via a pre-commit hook.

The key risk is bus factor: the Lead Architect is responsible for 143 of 151 commits (94.7%). While this reflects the early-stage nature of the project, expansion of active contributors will be important as the tool grows toward wider adoption.

---

## Technical Analysis

### Development Velocity

**Monthly commit distribution (within 24-month window, Sep 2025–Mar 2026):**

| Month | Commits | Phase |
|-------|---------|-------|
| 2025-09 | 38 | Foundation Sprint |
| 2025-10 | 37 | Feature Build-out |
| 2025-11 | 34 | Stabilization |
| 2025-12 | 10 | Consolidation |
| 2026-01 | 3 | Low Activity |
| 2026-02 | 3 | Low Activity |
| 2026-03 | 26 | Resurgence |

The three-month founding sprint (Sep–Nov 2025) was extraordinarily productive, averaging 36.3 commits per month. This pace is consistent with a single architect building a greenfield product — focused, rapid, and feature-oriented. The September 29 "Initial commit" was followed immediately by exporters, HTML report generation, and core analysis logic within the first 48 hours, indicating a developer who had a clear architecture in mind before the first commit.

The mid-project slowdown (3–10 commits/month from December 2025 through February 2026) is not a warning sign. Commits in this window include a security policy addition (November), dependency updates, and feature refinements. The project was not abandoned — it was being refined and operated.

March 2026's 26-commit resurgence marks a new phase: v1.3.0 delivery, removal of Azure DevOps integration remnants, codified governance via Spec Kit Spark (constitution amendments, archive agents, upgrade tooling), CodeQL security alert resolution, ESLint v10 migration, and the addition of the repo-story context script itself. This is characteristic of a project shifting from "build the tool" to "mature the project infrastructure."

**Change type distribution (151 commits):**

| Type | Count | % |
|------|-------|---|
| Features | 48 | 31.8% |
| Fixes | 34 | 22.5% |
| Documentation | 20 | 13.2% |
| Other | 15 | 9.9% |
| Chore | 13 | 8.6% |
| CI/Build | 6 | 4.0% |
| Tests | 8 | 5.3% |
| Refactor | 7 | 4.6% |

Feature work (31.8%) dominates, followed closely by bug fixes (22.5%), confirming active product development rather than maintenance-only activity.

**File type activity (touches across all commits):**

| Extension | Total Touches |
|-----------|--------------|
| .md | 357 |
| .ts | 327 |
| .json | 190 |
| .html | 88 |
| .ps1 | 32 |
| .yml | 23 |

TypeScript (327 touches) is the clear primary language. The markdown (357 touches) dominance reflects substantial investment in documentation — README evolution tracked across 20 commits, constitution amendments, Copilot session notes, and Spec Kit governance artifacts.

---

### Contributor Dynamics

**Anonymized contributor distribution:**

| Role | Commits | % of Total |
|------|---------|-----------|
| Lead Architect | 143 | 94.7% |
| Developer A | 4 | 2.6% |
| Developer B | 3 | 2.0% |
| Developer C | 1 | 0.7% |

The bus factor is 1. The Lead Architect accounts for nearly 19 out of every 20 commits. This is not unusual for a solo-founded open-source tool, but it represents the primary organizational risk as the project scales.

Developer B and Developer C contributions appear in March 2026, both via Dependabot automated dependency bump pull requests (picomatch, flatted). Developer A appears sporadically across months with documentation updates (including the v1.3.0 analytics report). This suggests the project is beginning to attract external participation, albeit at a very early stage.

**Monthly contributor activity shows an encouraging sign for March 2026:** 4 distinct contributors active, up from 1–2 in prior months. If this trend continues, the bus factor risk will reduce organically.

**Team growth trajectory:**

| Period | Active Contributors |
|--------|-------------------|
| Sep–Nov 2025 (founding sprint) | 1 |
| Dec 2025 | 2 |
| Jan 2026 | 2 |
| Feb 2026 | 1 |
| Mar 2026 | 4 |

---

### Quality Signals

**Conventional Commits adoption:**
- 115 of 151 commits follow the conventional commit specification — a 76.2% adoption rate.
- This is notably high for a project less than six months old and reflects deliberate process discipline.
- The remaining ~24% of commits (concentrated in the earliest weeks) predate the convention's establishment in the workflow.
- Prefix distribution: `feat` (48), `fix` (34), `docs` (20), `chore` (13), `ci` (6), `test` (8), `refactor` (7).

**Test investment:**
- 23 test-related commits across the history window.
- 267 test file touches recorded across the full history.
- Enforced coverage thresholds: Branches ≥75%, Functions ≥87%, Lines ≥86%, Statements ≥85%.
- Test files mirror the production source structure (`test/analyzer.test.ts`, `test/cli-commands.test.ts`, etc.) — a sign of structured, discipline-driven testing rather than ad-hoc coverage.

**Documentation discipline:**
- README.md was updated 20 times — once every ~9 days on average. This is unusually high and suggests documentation is treated as a first-class deliverable, not an afterthought.
- CHANGELOG.md tracked in 8 commits, indicating release-cycle awareness.
- Commit `chore: archive outdated npm publishing guides and fix summaries` (2026-03-30) demonstrates active documentation hygiene, not just documentation creation.

---

### Governance & Process Maturity

**Merge workflow:**
- 1 merged PR recorded in the commit history — a Dependabot security update (minimatch vulnerability, PR #2).
- The very low PR count reflects a solo-developer workflow where direct commits to `main` dominate. This is pragmatically appropriate for a single-contributor project but will require process evolution as the contributor base grows.

**Tag discipline:**
- 0 formal Git tags in the history window. However, commit `chore: release v1.3.0` (2026-03-14) confirms a release was made — suggesting the release process uses commit messages and npm publishing rather than Git-native tags. This is a minor governance gap: adding Git tags would improve release traceability, enable `git describe` version detection, and align with the project's existing `semver` dependency.

**Constitution governance:**
- Constitution exists at version 1.2.0, ratified 2026-02-20, with 2 formal amendments.
- Amendment history reflects deliberate evolution: v1.1.0 added documentation lifecycle rules (`stale docs must be removed/archived, not maintained`), v1.2.0 added module size guidelines (500 SHOULD / 1,000 MUST line limits) following a site audit that flagged 5 oversized files.
- 4 governance artifacts tracked in the repo.
- The constitution-as-code approach — committing governance decisions to version control with amendment history — is a mature practice rarely seen in projects under 6 months old.

**CI/CD infrastructure:**
- GitHub Actions in place (`.github/workflows/publish.yml`, `ci.yml`, `update-docs.yml`) — 5 CI-related commits in the window.
- CodeQL security scanning configured and actively maintained (CodeQL v4 upgrade committed March 30, 2026).
- Automated dependency updates via Dependabot active (2 PRs merged from Dependabot in March 2026).

---

### Architecture & Technology

**Primary stack:**
- **TypeScript** with strict mode (`noImplicitAny`, `exactOptionalPropertyTypes`, `noUnusedLocals` all enforced)
- **Node.js 20+** runtime
- **ESM-only** module system (`"type": "module"` in package.json; all imports use `.js` extensions)
- **Jest + ts-jest** for testing (30s timeout to handle real-repo Git operations)
- **Commander.js** CLI framework
- **Chalk 5.x** (ESM-only, no CommonJS compatibility)
- **Docker** support available (Dockerfile present)
- **GitHub Actions** for CI/CD

**Three-layer architecture** (consistently enforced):
1. `src/cli/` — argument parsing, validation, user interaction
2. `src/core/` — analysis, metric calculation, data processing
3. `src/output/` — format-specific serialization (HTML, JSON, CSV, Markdown, Console)

**Security architecture highlights:**
- All Git commands use `spawn()` with argument arrays — never shell string concatenation
- 200MB buffer limit to prevent DoS
- HTML reports implement Content Security Policy with SHA-256 hashed inline scripts (no `unsafe-inline`)
- All user/repo content HTML-escaped before template insertion
- Self-contained reports with no external API calls (except Bootstrap CSS with SRI integrity check)

**Notable architectural decision (September 2025):** A commit from September 30, 2025 titled "Refactor GitSpark to Eliminate Subjective Metrics and Enhance Objectivity" signals a fundamental design choice made very early — the tool would refuse to claim measurements it cannot actually make from Git data. This principle was later codified into the constitution as the "Analytical Integrity" principle.

---

## Change Patterns

**Top 5 most-modified files and their significance:**

| File | Changes | Interpretation |
|------|---------|----------------|
| `package.json` | 76 | Frequent version bumps, dependency updates, configuration iteration — expected for an npm-published CLI tool actively evolving its public API |
| `package-lock.json` | 63 | Mirrors package.json; routine npm dependency resolution |
| `src/output/html.ts` | 31 | The HTML report is the flagship output format and most complex deliverable. High churn reflects ongoing refinement of charts, CSP hashing, dark mode, and template logic |
| `src/core/analyzer.ts` | 27 | The analytical heart of the tool. Active iteration on metric calculation, author stats, file risk scoring, and governance analysis |
| `README.md` | 20 | Documentation-as-product — the README doubled as the marketing page for npm package discovery |

**Files with disproportionate churn:**

`src/output/html.ts` (31 changes) is the leading refactoring candidate. It is also acknowledged in constitution v1.2.0 as a "grandfathered oversized file" that exceeds the 500-line threshold. The Analytical Integrity principle and the Security requirements both intersect here — every new metric must be HTML-escaped and every inline script must have its CSP hash updated. This complexity is inherent to the feature's requirements but makes the file fragile. The constitution amendment (CAP-2026-001) has already flagged this for future decomposition.

Similarly, `src/core/analyzer.ts` (27 changes) is the second-highest-churn source file. Both files were explicitly grandfathered in the constitution's module size guideline, indicating the team is aware of the technical debt here.

**Directory-level patterns:**

- `src/` files account for the majority of functional changes — this is the active development area.
- `test/` files maintain close parity with `src/` changes (html-exporter.test.ts: 16, validation.test.ts: 12, console-exporter.test.ts: 7) — confirming tests are written alongside features rather than as catch-up.
- `.github/` directory (workflows, copilot-instructions, agents) received 7+ changes across multiple files — consistent investment in developer tooling and CI/CD infrastructure.
- `.documentation/` (constitution: 5 changes) shows governance artifacts are living documents, not set-and-forget.

**Removed integration:**

`src/integrations/azure-devops/` files (client.ts, config.ts, file-cache.ts) appear as hotspots with 4–6 changes each, culminating in the commit "Remove Azure DevOps integration remnants" (2026-03-14). This represents a feature that was built, evolved, and then deliberately removed — likely a strategic refocus on the core Git analytics value proposition rather than platform-specific integrations.

---

## Milestone Timeline

No formal Git tags exist within the 24-month analysis window. However, the commit history reveals clear functional milestones:

| Date | Event | Evidence |
|------|-------|---------|
| 2025-09-29 | **Project Launch** | Initial commit + HTML/JSON/Markdown exporters within first 24 hours |
| 2025-09-30 | **Architecture Pivot** | "Refactor GitSpark to Eliminate Subjective Metrics" — core philosophy established |
| 2025-10-03 | **Public Launch** | GitHub Pages demo site added; README transformed into public-facing homepage |
| 2025-11-21 | **Security Policy** | Comprehensive security policy and automation added |
| 2025-12-14 | **File Extension Exclusion** | `--exclude-extensions` feature shipped |
| 2026-01-25 | **Init Command** | `git-spark init` interactive config creation added |
| 2026-02-20 | **Constitution Ratified** | v1.0.0 constitution ratified via `/speckit.discover-constitution` |
| 2026-03-14 | **v1.3.0 Release** | Major release; Azure DevOps integration removed; CodeQL alerts resolved |
| 2026-03-14 | **Constitution v1.2.0** | Module size guidelines added (CAP-2026-001) |
| 2026-03-30 | **Governance Maturation** | Spec Kit Spark agents, repo-story tooling, ESLint v10, CI/CD hardening |

**Velocity correlation with milestones:** The October 2025 public launch (GitHub Pages demo, README overhaul) coincides with the second-highest monthly commit count (37). Activity naturally decelerated after the public launch stabilized, with December 2025 representing a lower-intensity period. March 2026's 26-commit month closely follows v1.3.0 delivery, suggesting the release unlocked a new wave of infrastructure and governance work.

---

## Constitution Alignment

The project constitution (v1.2.0, ratified 2026-02-20) defines 5 mandatory technical principles and 3 security requirement areas. The commit history provides meaningful signals about adherence:

### Principle I: Type Safety

**Strong alignment.** TypeScript is the dominant language (327 file touches). The `tsconfig.json` has been modified 8 times — consistent with maintaining and tightening strict-mode settings. Zero TypeScript compilation errors are enforced in CI. Commit `chore(deps): upgrade ESLint to v10 and fix new default rules` (2026-03-14) shows active investment in maintaining linting standards.

### Principle II: Testing Standards

**Strong alignment.** 23 test-related commits; test files touched 267 times. The coverage thresholds are enforced by Jest configuration in `package.json`. The pre-commit hook blocks commits that fail tests. Commit history shows test files consistently added or updated alongside feature changes.

**Minor gap:** 8 test-type commits vs. 48 feature-type commits — test coverage may be lagging behind feature velocity at times. Monitoring test coverage trends over time would confirm.

### Principle III: Analytical Integrity

**Strong alignment — and this is the project's defining principle.** The September 30, 2025 architectural refactor specifically eliminated subjective metrics. The constitution codifies this as a non-negotiable rule. Commit messages like "Implement comprehensive updates for team metrics transparency and accuracy" confirm this principle was actively enforced during development, not just declared.

### Principle IV: Layered Architecture

**Strong alignment.** The directory structure (`src/cli/`, `src/core/`, `src/output/`, `src/utils/`) directly maps to the four mandated layers. Hotspot analysis shows changes concentrated in each layer independently, suggesting good separation of concerns is maintained in practice.

**Watch area:** `src/output/html.ts` (31 changes, grandfathered oversized file) represents accumulated complexity in the Output layer. Constitution v1.2.0 acknowledges this and the decomposition guidance should be acted upon in a future sprint.

### Principle V: ESM Module System

**Strong alignment.** `"type": "module"` enforced in `package.json`. The module system configuration in `tsconfig.json` (8 changes) shows active maintenance. Chalk 5.x (ESM-only) selection confirms ESM-first dependency choices.

### Security Requirements

**Strong alignment — proactively maintained.** Key evidence:
- `fix: resolve all open CodeQL security scan alerts` (2026-03-14) — reactive-yet-timely response to security findings
- `ci: upgrade CodeQL workflow to v4` (2026-03-30) — proactive security tooling maintenance
- `fix(deps): patch flatted transitive dep to fix high severity vuln` (2026-03-14) — supply chain security awareness
- `security: add comprehensive security policy and automation` (2025-11-21) — security posture established early
- Dependabot automated dependency updates active (picomatch, flatted bumps in March 2026)

**Notable gap:** Git tags for releases are absent, which the constitution's dependency management section implies through version control best practices. Adding annotated tags at each release would complete the governance picture.

---

*Generated by /speckit.repo-story | Spec Kit Spark — Adaptive System Life Cycle Development*
