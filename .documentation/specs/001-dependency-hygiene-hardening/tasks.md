# Tasks: Dependency Hygiene Hardening

**Input**: Design documents from `.documentation/specs/001-dependency-hygiene-hardening/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- `[P]`: Can run in parallel (different files, no unfinished dependency)
- `[Story]`: User story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only
- Every task includes an explicit file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create evidence artifacts and baseline workflow inputs.

- [ ] T001 Create dependency candidate register scaffold in `.documentation/specs/001-dependency-hygiene-hardening/dependency-update-candidates.md`
- [ ] T002 Create dead-code candidate register scaffold in `.documentation/specs/001-dependency-hygiene-hardening/dead-code-candidates.md`
- [ ] T003 [P] Create documentation assertion matrix scaffold in `.documentation/specs/001-dependency-hygiene-hardening/documentation-assertions.md`
- [ ] T004 [P] Create implementation change summary scaffold in `.documentation/specs/001-dependency-hygiene-hardening/change-summary.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Generate objective discovery evidence used by all stories.

**CRITICAL**: No story implementation starts until these discovery artifacts are complete.

- [ ] T005 Run `npm outdated` and record raw output in `.documentation/specs/001-dependency-hygiene-hardening/dependency-outdated.txt`
- [ ] T006 [P] Run `npm audit --audit-level=moderate` and record raw output in `.documentation/specs/001-dependency-hygiene-hardening/dependency-audit.txt`
- [ ] T007 [P] Run `npx npm-check-updates` and record raw output in `.documentation/specs/001-dependency-hygiene-hardening/dependency-ncu.txt`
- [ ] T008 [P] Run `npx knip` and record raw output in `.documentation/specs/001-dependency-hygiene-hardening/dead-code-knip.txt`
- [ ] T009 Consolidate discovery results into candidate rows (version delta, semver impact, severity, disposition placeholder) in `.documentation/specs/001-dependency-hygiene-hardening/dependency-update-candidates.md`
- [ ] T010 Consolidate dead-code signals into candidate rows (type, location, evidence, risk, action placeholder) in `.documentation/specs/001-dependency-hygiene-hardening/dead-code-candidates.md`

**Checkpoint**: Foundation evidence is complete; user stories can proceed.

---

## Phase 3: User Story 1 - Refresh Dependencies Safely (Priority: P1) 🎯 MVP

**Goal**: Apply safe dependency updates and preserve delivery quality gates.

**Independent Test**: Approved dependency updates are applied, and `prebuild`, `lint`, `test`, and `build` pass.

### Implementation for User Story 1

- [ ] T011 [US1] Classify each dependency candidate by `patch|minor|major` and security override in `.documentation/specs/001-dependency-hygiene-hardening/dependency-update-candidates.md`
- [ ] T012 [US1] Mark `apply-now|defer|reject` dispositions with rationale for every candidate in `.documentation/specs/001-dependency-hygiene-hardening/dependency-update-candidates.md`
- [ ] T013 [US1] Apply approved patch/minor updates in `package.json`
- [ ] T014 [US1] Regenerate lockfile after approved updates in `package-lock.json`
- [ ] T015 [US1] Document deferred/rejected major updates with owner and mitigation rationale in `.documentation/specs/001-dependency-hygiene-hardening/dependency-update-candidates.md`
- [ ] T037 [US1] Add/update targeted dependency-regression Jest tests for affected behavior in `test/dependency-hygiene-regression.test.ts`
- [ ] T016 [US1] Run `npm run prebuild` and capture result in `.documentation/specs/001-dependency-hygiene-hardening/validation-prebuild.txt`
- [ ] T017 [US1] Run `npm run lint`, `npm test`, and `npm run build`, capturing results in `.documentation/specs/001-dependency-hygiene-hardening/validation-quality-gates.txt`
- [ ] T018 [US1] Re-run `npm audit --audit-level=moderate` and update residual risk/disposition entries in `.documentation/specs/001-dependency-hygiene-hardening/dependency-update-candidates.md`

**Checkpoint**: Dependency refresh is complete and quality gates remain green.

---

## Phase 4: User Story 2 - Enforce No Dead Code Hygiene (Priority: P2)

**Goal**: Remove unused dependencies/code safely and codify no-dead-code governance.

**Independent Test**: Selected unused artifacts are removed without regressions; policy is explicit in constitution.

### Implementation for User Story 2

- [ ] T019 [US2] Verify each dead-code candidate for dynamic usage risk and action decision using the safety rubric in `.documentation/specs/001-dependency-hygiene-hardening/contracts/dependency-hygiene-contract.md` and record outcomes in `.documentation/specs/001-dependency-hygiene-hardening/dead-code-candidates.md`
- [ ] T020 [US2] Remove approved unused dependencies from `package.json`
- [ ] T021 [US2] Apply validated dead-code removals in `src/core/analyzer-helpers.ts` and update dependent expectations in `test/analyzer.test.ts` using safety-rubric acceptance checks
- [ ] T038 [US2] Add/update targeted dead-code regression Jest tests for removed paths in `test/analyzer.test.ts`
- [ ] T022 [US2] Refresh lockfile after dependency removals in `package-lock.json`
- [ ] T023 [US2] Re-run `npm run lint`, `npm test`, and `npm run build`, capture dead-code validation results in `.documentation/specs/001-dependency-hygiene-hardening/validation-dead-code.txt`, and record safety-rubric rollback outcomes if any
- [ ] T039 [US2] Compute and record SC-003 removal ratio (`removed_verified_unused / total_verified_unused`) with pass/fail threshold evidence in `.documentation/specs/001-dependency-hygiene-hardening/change-summary.md`
- [ ] T024 [US2] Add explicit no-dead-code policy clause and enforcement language in `.documentation/memory/constitution.md`, synchronizing constitution metadata (`Version`, `Last Amended`, amendment log, and footer line)
- [ ] T025 [US2] Reference constitutional policy compliance in `.documentation/specs/001-dependency-hygiene-hardening/checklists/requirements.md`

**Checkpoint**: Dead-code hygiene is enforced in both code and governance.

---

## Phase 5: User Story 3 - Keep Documentation Truthful (Priority: P3)

**Goal**: Align documentation to current behavior, commands, ownership boundaries, and outputs.

**Independent Test**: Documentation assertions are verified and mismatches are corrected/removed/deferred with traceability.

### Implementation for User Story 3

- [ ] T026 [US3] Build assertion-to-source-of-truth matrix entries in `.documentation/specs/001-dependency-hygiene-hardening/documentation-assertions.md`
- [ ] T027 [US3] Validate and update maintainer workflow/command guidance in `README.md`
- [ ] T028 [US3] Validate and update performance and operational docs in `docs/performance-tuning.md`
- [ ] T029 [US3] Validate and update contribution workflow guidance in `CONTRIBUTING.md`
- [ ] T030 [US3] Validate and update security process statements in `SECURITY.md`
- [ ] T031 [US3] Archive or remove stale internal guidance and record decision trace in `.documentation/specs/001-dependency-hygiene-hardening/documentation-assertions.md`
- [ ] T032 [US3] Record final assertion outcomes (`valid|corrected|removed|deferred`) with owner/rationale where deferred in `.documentation/specs/001-dependency-hygiene-hardening/documentation-assertions.md`

**Checkpoint**: Documentation accurately reflects current implementation and governance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize traceability and release-ready summary.

- [ ] T033 [P] Verify feature metadata consistency (`classification`, `risk_level`, `required_gates`) between frontmatter and execution evidence in `.documentation/specs/001-dependency-hygiene-hardening/spec.md`
- [ ] T034 Consolidate final implementation outcomes (updated, removed, deferred) in `.documentation/specs/001-dependency-hygiene-hardening/change-summary.md`
- [ ] T035 [P] Update release-facing highlights for this feature in `CHANGELOG.md`
- [ ] T036 Run quickstart validation sequence and record final pass/fail evidence in `.documentation/specs/001-dependency-hygiene-hardening/validation-final.txt`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies.
- Foundational (Phase 2): Depends on Setup.
- User Stories (Phases 3-5): Depend on Foundational completion.
- Polish (Phase 6): Depends on all completed story phases.

### User Story Dependencies

- US1 (P1): Starts after Phase 2; no dependency on US2/US3.
- US2 (P2): Starts after Phase 2; should consume US1 evidence for dependency dispositions.
- US3 (P3): Starts after Phase 2; should consume US1/US2 implementation outcomes for doc truth alignment.

### Story Completion Order

- Preferred incremental order: US1 -> US2 -> US3
- Parallel-capable order after Phase 2: US1 and US3 can begin in parallel; US2 should start after US1 dispositions are stable.

---

## Parallel Execution Examples

### User Story 1

- Parallel option A: T013 (`package.json`) and T015 (`dependency-update-candidates.md`) after T012.
- Parallel option B: T016 (`validation-prebuild.txt`) can run before T017 (`validation-quality-gates.txt`) in separate terminals.

### User Story 2

- Parallel option A: T020 (`package.json`) and T024 (`.documentation/memory/constitution.md`) after T019.
- Parallel option B: T023 (`validation-dead-code.txt`) can be prepared while T025 (`checklists/requirements.md`) is authored after validation output is available.

### User Story 3

- Parallel option A: T027 (`README.md`) and T028 (`docs/performance-tuning.md`) after T026.
- Parallel option B: T029 (`CONTRIBUTING.md`) and T030 (`SECURITY.md`) can run in parallel with T031 (`documentation-assertions.md`) when no overlapping edits exist.

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) and validate gates.
3. Stop and review risk posture before dead-code or doc-wide changes.

### Incremental Delivery

1. Deliver US1 dependency upgrades and security posture.
2. Deliver US2 dead-code reductions and constitution policy.
3. Deliver US3 documentation truth alignment.
4. Finish with cross-cutting summary and quickstart validation.

### Team Parallel Strategy

1. One maintainer runs discovery and triage artifacts (Phases 1-2).
2. One maintainer executes dependency updates (US1) while another starts assertion matrix prep (US3).
3. Dead-code cleanup (US2) proceeds once update dispositions stabilize.

---

## Notes

- Tasks follow required checklist format: `- [ ] T### [P?] [US?] Description with file path`.
- If unresolved required gate findings appear later (`analyze`, `critic`, `gates/*`), record explicit user decision under `## Gate Acknowledgements` before proceeding.
