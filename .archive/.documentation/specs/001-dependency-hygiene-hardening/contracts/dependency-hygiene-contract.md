# Contract: Dependency Hygiene Workflow

## Purpose

Define the repeatable command contract, evidence outputs, and acceptance checks for dependency hygiene hardening.

## Inputs

- Repository root with `package.json` and lockfile
- Existing CI-quality commands:
  - `npm run prebuild`
  - `npm run lint`
  - `npm test`
  - `npm run build`
- Discovery tools:
  - `npm outdated`
  - `npm audit --audit-level=moderate`
  - `npx npm-check-updates`
  - `npx knip` (unused dependency/code analysis)

## Command Sequence Contract

1. Discovery (read-only)
- `npm outdated`
- `npm audit --audit-level=moderate`
- `npx npm-check-updates`
- `npx knip`

2. Triage
- Build candidate table with semver impact and security severity.
- Assign disposition (`apply-now`, `defer`, `reject`) with rationale.

3. Apply approved updates
- Apply selected package updates and lockfile changes.
- Remove approved unused dependencies/dead code candidates.

4. Validate
- `npm run prebuild`
- `npm run lint`
- `npm test`
- `npm run build`
- Re-run `npm audit --audit-level=moderate`

5. Documentation and governance reconciliation
- Update documentation assertions to valid/corrected/removed/deferred.
- Amend constitution with explicit no-dead-code clause.

## Output Artifacts

Required per run:
- Dependency update candidate list with dispositions
- Dead code candidate list with decisions and evidence
- Documentation assertion matrix with outcomes
- Validation command results summary
- Deferred items list with owner/reason

## Acceptance Contract

- All moderate+ direct dependency audit findings are resolved or explicitly mitigated with rationale.
- No dependency update is merged without passing lint/test/build gates.
- No dead-code removal is accepted without validation pass.
- Documentation changes are source-of-truth verified.
- Constitution contains explicit no-dead-code policy text before feature completion.

## Safety Decision Rubric

Use this rubric for every candidate in the dependency and dead-code registers before setting `apply-now`, `defer`, or `reject`.

1. Evidence requirements (all required)
- Candidate has at least one objective signal: `npm outdated`, `npm audit`, `npx npm-check-updates`, `npx knip`, or static reference search.
- Candidate entry records impacted files/modules and expected behavior surface.
- Candidate entry records semver impact (`patch|minor|major`) or code-removal blast radius (`low|medium|high`).

2. Acceptance checks by decision
- `apply-now`: full quality gates pass (`prebuild`, `lint`, `test`, `build`) and no new moderate+ audit findings are introduced.
- `defer`: includes explicit rationale, owner, target review date, and mitigation plan.
- `reject`: includes explicit reason tied to evidence quality or invalid signal.

3. Rollback criteria (mandatory)
- Any new test failure, lint failure, build failure, or behavior regression triggers immediate rollback of the candidate change.
- Rollback is recorded in the candidate row with a short incident note and next action.

4. SC-003 measurement contract
- Compute `unused_dependency_removal_ratio = removed_verified_unused / total_verified_unused`.
- `total_verified_unused` includes only candidates classified as verified unused after rubric review.
- Candidates deferred for compatibility or rollout constraints remain in the denominator and require rationale.
- Pass threshold: `unused_dependency_removal_ratio >= 0.90`.
- Record numerator, denominator, ratio, and pass/fail outcome in feature evidence artifacts.

## Failure Contract

The run is failed when any of the following occurs:
- Validation gates fail after applied changes.
- Moderate+ vulnerabilities remain without documented mitigation.
- Dead-code removals break behavior or tests.
- Documentation assertions are changed without evidence.
- Constitution update is omitted.
