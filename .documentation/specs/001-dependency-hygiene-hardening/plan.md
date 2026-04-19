# Implementation Plan: Dependency Hygiene Hardening

**Branch**: `001-dependency-hygiene-hardening` | **Date**: 2026-04-19 | **Spec**: `/.documentation/specs/001-dependency-hygiene-hardening/spec.md`
**Input**: Feature specification from `/.documentation/specs/001-dependency-hygiene-hardening/spec.md`

## Summary

Perform a repository-wide dependency hygiene pass that is evidence-driven (`npm audit`, `npm outdated`, and `npm-check-updates`), applies safe upgrades, removes unused dependencies and dead code where validated, and reconciles all user-facing and internal documentation with the current implementation boundaries. The plan includes constitutional evolution to add an explicit no-dead-code policy while preserving existing security, testing, and architecture constraints.

## Technical Context

**Language/Version**: TypeScript 6.x, Node.js >=20.19.0, npm >=10.0.0  
**Primary Dependencies**: commander, chalk, boxen, ora, table, semver; dev tools: jest/ts-jest, eslint, @typescript-eslint, prettier, typedoc  
**Storage**: File-based repository artifacts (`package.json`, lockfile, Markdown docs, generated report assets)  
**Testing**: `npm test` (Jest with enforced coverage), `npm run lint`, `npm run build`, plus security audit commands  
**Target Platform**: Cross-platform CLI (Windows, macOS, Linux), Node.js runtime  
**Project Type**: CLI + library package  
**Performance Goals**: No regression to existing report-generation behavior; dependency checks complete in standard CI budget  
**Constraints**: Maintain strict TypeScript + ESM rules, preserve layered architecture, do not treat `docs/` as internal DevSpark working docs, maintain analytical integrity and metric honesty  
**Scale/Scope**: Single package repository with cross-cutting updates across dependencies, policy docs, and developer documentation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Review

| Gate | Status | Notes |
|------|--------|-------|
| Type Safety | PASS | Plan keeps strict TypeScript and compile gates unchanged. |
| Testing Standards | PASS | Validation path includes `prebuild`, tests, lint, build; coverage thresholds remain enforced. |
| Analytical Integrity | PASS | No analytics semantics are expanded beyond Git-derived data; docs updates emphasize existing limitations. |
| Layered Architecture | PASS | Work focuses on dependency/doc/policy hygiene and avoids cross-layer refactoring without tests. |
| ESM Module System | PASS | No CommonJS migration; ESM import extension rules remain intact. |
| Security (command + HTML) | PASS | Existing command and HTML hardening rules remain mandatory and are not relaxed. |
| Dependency Management | PASS | This feature directly executes the constitutional dependency-audit mandate. |
| Documentation Standards | PASS (with required amendment) | FR-006 requires a new no-dead-code clause; constitutional amendment is part of planned deliverables. |
| Required Spec Gates (`checklist`, `analyze`, `critic`) | PARTIAL | `checklist` evidence exists; `analyze` and `critic` execution is deferred to downstream workflow steps outside this plan artifact generation. |

### Post-Phase 1 Gate Re-Check

Design artifacts (`research.md`, `data-model.md`, `contracts/`, `quickstart.md`) are complete and keep all constitutional constraints explicit. No unresolved `NEEDS CLARIFICATION` items remain.

## Project Structure

### Documentation (this feature)

```text
.documentation/specs/001-dependency-hygiene-hardening/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dependency-hygiene-contract.md
└── tasks.md             # Created by /devspark.tasks, not by this workflow
```

### Source Code (repository root)

```text
src/
├── cli/
├── core/
├── output/
├── utils/
├── types/
└── integrations/

scripts/
test/
docs/                    # Public GitHub Pages output (CI-owned)
.documentation/          # Internal specs, constitution, workflow artifacts
```

**Structure Decision**: Use the existing single-package CLI/library structure and keep this feature implementation cross-cutting across dependency manifests, documentation, and focused source cleanup without introducing new architecture layers.

## Phase Plan

### Phase 0 - Research

- Resolve tooling strategy for discovery (`audit`, `outdated`, `ncu`) and unused/dead-code detection.
- Define risk categorization rubric for patch/minor/major updates.
- Define documentation verification approach tied to current source-of-truth files.

### Phase 1 - Design & Contracts

- Model update candidates, dead-code candidates, documentation assertions, and constitution clause changes.
- Define repeatable command contract and evidence artifacts for dependency hygiene execution.
- Define objective safety-decision rubric (evidence requirements, acceptance checks, rollback criteria) in `contracts/dependency-hygiene-contract.md` and require it for dead-code/dependency dispositions.
- Define SC-003 measurement method (`removed_verified_unused / total_verified_unused`) with explicit numerator/denominator evidence recording.
- Produce quickstart runbook suitable for maintainers and CI rehearsal.
- Update agent context script output after design artifacts are present.

### Phase 2 - Task Planning Handoff

- Handoff to `/devspark.tasks` for executable task breakdown and sequencing.

## Complexity Tracking

No constitutional violations require special complexity waiver at planning time.
