# Repository Story: git-spark

> Generated 2026-04-03 | Window: 12 months | Scope: full

---

## Executive Summary

**git-spark** is an enterprise-grade Git repository analytics tool built on Node.js 20+ and TypeScript. Its core mission is to transform raw Git commit history into actionable, transparent reports — delivered in HTML, JSON, CSV, Markdown, and Console formats. The project differentiates itself through a philosophy of analytical honesty: it never guesses at metrics that Git data cannot support, and it documents every limitation clearly.

Over its 185-day recorded history — from a first commit on September 29, 2025 through April 3, 2026 — the project has accumulated **159 commits** from **4 contributors**, with the Lead Architect responsible for 95% of all contributions. The project launched on npm and hosts a live GitHub Pages demo at `https://github.com/markhazleton/git-spark`, demonstrating reporting against its own repository.

Development velocity followed a classic greenfield sprint pattern: **38 commits in September**, **37 in October**, and **34 in November** fueled an intense 100+ commit launch phase. Activity then dropped sharply — just 3 commits each in January and February 2026 — before a strong resurgence to **31 commits in March 2026**, coinciding with the v1.3.0 release, a TypeScript 6 upgrade, and an architectural governance milestone (the DevSpark framework migration and constitution v1.4.0 ratification).

Governance posture is notably mature for a project of this age. **76.7% of commits (122 of 159) use Conventional Commit format**, the project has a ratified constitution with 10 amendments tracking its evolution, GitHub Actions CI/CD is active, and an internal site audit framework actively monitors code quality compliance. The one formal version tag signals the project has entered deliberate release discipline after initial rapid delivery.

The primary risk to long-term health is a **single-contributor bus factor**: the Lead Architect authored 151 of 159 commits (94.97%). While Developers A, B, and C have made appearances — particularly in March 2026 — meaningful distribution of authorship has not yet materialized. For a tool promoting team analytics, broadening the contributor base would serve both resilience and credibility.

---

## Technical Analysis

### Development Velocity

The project launched explosively. The three months from September through November 2025 averaged **36.3 commits/month**, an intense greenfield pace driven by the Lead Architect building the entire foundational architecture — CLI layer, Git data collection, analysis engine, all five output formats, and the initial test suite. The annotated milestone commits tell the story clearly:

- **September 29**: `Initial commit` → same day: `implement HTML, JSON, and Markdown exporters` → `Enhance HTML report with export options, charts, and accessibility improvements`
- **October**: Multiple README overhauls, configurable file filtering, GitHub Pages demo site launch
- **November**: Security policy hardening, conventional commit adoption spike, extensive test coverage improvements

The December–February trough (10 → 3 → 3 commits) suggests either deliberate stabilization, external obligations, or both. Notably, these months saw fewer but more intentional commits — dependency updates, performance thresholds, and the `git-spark init` command feature.

March 2026 brought the strongest single-month resurgence since launch: **31 commits** delivering a TypeScript 6.0.2 upgrade, comprehensive CSS styling, the CI/CD pipeline overhaul (4 CI-related commits on March 30 alone), removal of the Azure DevOps integration remnants, and the framework migration from Spec Kit to DevSpark. This was a quality-consolidation sprint as much as a feature sprint.

**File-type velocity** reinforces this story. Across all 159 commits, `src/output/html.ts` was touched **32 times** and `src/core/analyzer.ts` **27 times** — the two core engines of the tool received near-continuous refinement. The HTML report is clearly the flagship output and the most actively developed surface.

### Contributor Dynamics

| Role | Commits | % Share |
|------|---------|---------|
| Lead Architect | 151 | 94.97% |
| Developer A | 4 | 2.52% |
| Developer B | 3 (+ 2 Dependabot PRs) | 1.89% |
| Developer C | 1 | 0.63% |

The contributor profile is unambiguous: this is a solo-driven project with occasional external participation. Developer A and C appear in documentation updates and minor fixes; Developer B's contributions are primarily Dependabot dependency bumps. March 2026 saw the most distributed activity (Developer B: 3, Developer C: 1, Developer A: 1, alongside 26 Lead Architect commits), suggesting early onboarding signals.

**Bus factor assessment**: The project currently has a bus factor of 1. All architectural decisions, all core feature work, all security hardening, and all governance evolution reside in one contributor's commit stream. For a tool marketed to teams tracking Git health, the irony is not lost — and it is worth treating this as a tracked risk.

Team growth has not yet occurred organically. The 185-day history shows no new contributors establishing regular cadence after the initial sprint. This is common for early-stage developer tools but worth monitoring as the project seeks npm adoption.

### Quality Signals

**Test coverage** is a stated priority and the data confirms it. Test files were touched **272 times** across commits, and **25 commits were explicitly test-related** — roughly 1 in 6 commits has a testing dimension. The `test/html-exporter.test.ts` alone was modified **18 times**, reflecting the complexity of validating the HTML output engine and its security hardening (CSP hash verification, HTML escaping).

**Conventional Commit adoption**: 122 of 159 commits (76.7%) use recognized conventional prefixes. The 37 unclassified commits are concentrated in the earliest phase (September–October) when the project was moving fast and before the Conventional Commit norm was established. By November and beyond, nearly all commits carry `feat:`, `fix:`, `docs:`, `chore:`, `ci:`, or `test:` prefixes.

**Commit message quality**: The `subject_type_estimates` from change patterns show:
- **Features**: 52 commits (32.7%) — dominated by new capabilities
- **Fixes**: 34 commits (21.4%) — active defect resolution
- **Docs**: 23 commits (14.5%) — strong documentation culture
- **Chore**: 13 commits (8.2%) — dependency and housekeeping discipline
- **Other**: 15 commits (9.4%)
- **Tests**: 9 commits (5.7%)
- **Refactor**: 7 commits (4.4%)
- **CI/Build**: 6 commits (3.8%)

The 21.4% fix rate on a 6-month-old project is elevated but not alarming — it reflects the complexity of building a reliable CLI tool against real Git repositories with edge cases. The 14.5% documentation rate is notably high and reflects the project's philosophical commitment to transparency.

### Governance & Process Maturity

Governance maturity is a genuine strength of git-spark. The project has:

- A **ratified project constitution** (v1.4.0) with 10 tracked amendments since ratification in February 2026
- **4 governance artifacts** actively maintained
- **GitHub Actions CI/CD** with a publish workflow using OIDC trusted publishing (`provenance: true`)
- A **Dockerfile** for containerization
- A CI pipeline that enforces TypeScript compilation, test coverage thresholds, and linting gates before merge
- The **DevSpark framework** migrated April 2, 2026 — a governance evolution from Spec Kit, adding structured feature specification, plan, and task workflows

The 1 formal git tag (note: `milestones.tags` shows 0 annotated tags, but `summary.total_tags: 1` suggests a lightweight tag) reflects careful version discipline starting in 2026. Version history is traceable through commit messages mentioning v1.0.125 (October 2025) and the explicit `chore: release v1.3.0` commit on March 14, 2026.

The constitution's amendment history tells a maturation story: from an initial 1.0.0 ratification based on discovered conventions, through module-size guardrails (1.2.0), documentation lifecycle rules (1.1.0), decomposition documentation obligations (1.3.0), and decomposition output sizing rules (1.4.0). Each amendment was evidence-driven, triggered by site audits or PR reviews — exactly the kind of empirical governance the project advocates.

### Architecture & Technology

**Language ecosystem**: TypeScript is the primary implementation language (336 file touches), JavaScript appears in scripts and configuration (18 file touches + 4 .cjs touches), PowerShell drives the DevSpark toolchain (48 ps1 touches), and Markdown is the most-touched file type by far (468 — driven by documentation-heavy commit practices and session artifacts).

**Configuration maturity** is high:
- `package.json` (77 touches) and `package-lock.json` (64 touches) together account for 141 file touches — version discipline and dependency management are continuously active
- GitHub Actions workflows present and actively maintained (CI + publish)
- ESLint with TypeScript plugin enforced
- Dockerfile available for containerized deployment
- `.nvmrc` for Node version pinning

**Architecture signals**: The three-layer CLI→Core→Output pipeline is established and enforced by the constitution. The hotspot data confirms this separation is holding: the top modified source files map cleanly to each layer:
- CLI layer: `src/cli/commands.ts` (19 touches)
- Core layer: `src/core/analyzer.ts` (27), `src/core/collector.ts` (14)
- Output layer: `src/output/html.ts` (32)
- Type contracts: `src/types/index.ts` (15)

The presence of `src/integrations/azure-devops/` in the hotspot list (removed in March 2026) tells a strategic story: an Azure DevOps integration was built and later cleanly removed, simplifying the project scope and reducing surface area.

---

## Change Patterns

### Top 5 Most-Modified Files

| Rank | File | Changes | Interpretation |
|------|------|---------|----------------|
| 1 | `package.json` | 77 | Continuous versioning, dependency management — expected for an npm-published package |
| 2 | `package-lock.json` | 64 | Dependency lock file reflects all dep updates; healthy lock discipline |
| 3 | `src/output/html.ts` | 32 | Primary output engine and flagship feature; active development and security hardening |
| 4 | `src/core/analyzer.ts` | 27 | Core analytics logic; continuously refined as metric accuracy improves |
| 5 | `README.md` | 21 | Documentation investment correlating with npm adoption focus |

### Hotspot Risk Assessment

`src/output/html.ts` (32 changes) warrants attention beyond just activity — the constitution's v1.2.0 amendment explicitly grandfathered it as an oversized file (>500 lines) requiring decomposition tracking (Issue #6). The January 2026 decomposition work extracted `html-author-profiles.ts`, `html-daily-trends.ts`, `html-scripts.ts`, `html-styles.ts`, and `html-utils.ts`. The constitution notes `html-styles.ts` (820L) and `html-daily-trends.ts` (817L) are still on the remediation list.

`src/core/analyzer.ts` (27 changes) is also grandfathered as oversized. An extraction of `GitSpark` class to `src/core/git-spark.ts` is tracked as a follow-up action.

### Directory-Level Patterns

- **`src/` activity**: The TypeScript source tree dominates code changes, with most activity in `src/output/` (HTML generation refinement) and `src/core/` (analysis logic)
- **`test/` activity**: Test files shadow core production changes closely — nearly every feature file has a corresponding test file in the hotspot list
- **`.documentation/` and `.devspark/`**: Governance artifacts appear in the hotspot list (`constitution.md` at 6 changes, `site-audit.ps1` at 4) — the developer treats documentation commits as first-class work
- **`docs/`**: GitHub Pages site files (`index.html` 15 touches, `git-spark-report.html` 11 touches) reflect continuous demo report regeneration as the tool evolves

---

## Milestone Timeline

No annotated git tags were found. Version discipline is primarily tracked through commit messages:

| Period | Signal | Context |
|--------|--------|---------|
| Sep 29, 2025 | Initial commit | Project genesis — CLI, multi-format exporters in first two days |
| Oct 3, 2025 | GitHub Pages demo launched | `docs: add GitHub Pages demo site with interactive report` |
| Oct 3–10, 2025 | v1.0.125 documented | Multiple README commits establishing npm publication |
| Nov 21, 2025 | Security hardening | `security: add comprehensive security policy and automation` |
| Dec 14, 2025 | File extension exclusion | `feat: add file extension exclusion feature for analysis` |
| Jan 25, 2026 | `git-spark init` command | Interactive config creation capability added |
| Mar 14, 2026 | v1.3.0 release | `chore: release v1.3.0` — TypeScript 6 upgrade, code structure refactor |
| Mar 30, 2026 | DevSpark framework prep | CI/CD overhaul, repo-story tooling, CSS consolidation |
| Apr 2, 2026 | DevSpark migration | `chore: migrate Spec Kit to DevSpark framework`; constitution v1.4.0 ratified |
| Apr 3, 2026 | Documentation harvest | Accuracy review of all .md files |

**Velocity context**: The v1.3.0 release on March 14 was preceded by a 31-commit March sprint — peak post-launch activity. This confirms releases correlate with concentrated effort bursts.

---

## Constitution Alignment

Constitution v1.4.0 (ratified 2026-04-02) with 10 amendments. Analysis window: full history.

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Type Safety** (MANDATORY) | ✅ Strong alignment | TypeScript strict mode enforced; CI blocks on compilation failure; `noImplicitAny` in tsconfig; TypeScript upgraded to 6.0.2 in March 2026 |
| **II. Testing Standards** (MANDATORY) | ✅ Strong alignment | Jest test suite with enforced coverage thresholds (branches ≥75%, functions ≥87%); pre-commit hooks block failing tests; 272 test file touches across history |
| **III. Analytical Integrity** (MANDATORY) | ✅ Exemplary alignment | Core philosophy of the project; `limitations` objects in type definitions; honest metric naming; "never guessing" is the founding principle |
| **IV. Layered Architecture** (MANDATORY) | ✅ Strong alignment | Three-layer CLI→Core→Output pattern evident in hotspot distribution; constitution enforced in PR reviews; no circular dependencies detected |
| **V. ESM Module System** (MANDATORY) | ✅ Strong alignment | `"type": "module"` in package.json; bundler resolution mode; all imports use `.js` extensions |
| **Security: Command Injection** (MANDATORY) | ✅ Strong alignment | `spawn()` with argument arrays throughout `src/utils/git.ts`; input validation via `validateGitOptions()`; 200MB buffer limits |
| **Security: HTML Report** (MANDATORY) | ✅ Strong alignment | CSP with SHA-256 hashed inline scripts; no `unsafe-inline`; HTML escaping on all user content |

**Gap Areas** (documented in constitution follow-ups):

1. **Module size violations**: `html-styles.ts` (820L) and `html-daily-trends.ts` (817L) exceed the 500-line SHOULD NOT threshold. Both are grandfathered with remediation tracked in Issue #6. The constitution amendment process itself demonstrates healthy governance — the gap was identified, documented, and tracked rather than ignored.

2. **JSDoc gaps** (CAP-2026-002/003): 12 exported functions in `html-daily-trends.ts` and 8 exported interfaces in `types/author.ts` lack required JSDoc. These are tracked follow-up items from the April 2, 2026 constitution evolution.

3. **Bus factor as governance risk**: No constitutional principle currently addresses contributor concentration risk. Given the project's positioning as a team analytics tool, formalizing a "contributor distribution goal" in the constitution would strengthen alignment between product philosophy and project practice.

**Overall governance alignment: High**. The commit history demonstrates the constitution is a living document, not shelf-ware. 10 amendments in ~6 weeks of formal governance reflects active use. The amendment-driven workflow (site-audit → constitution amendment → follow-up tracking) is exactly the evidence-based cycle the project was designed to support.

---

*Generated by /devspark.repo-story | DevSpark — Adaptive System Life Cycle Development*
