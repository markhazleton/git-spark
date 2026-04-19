# Research: Dependency Hygiene Hardening

## Decision 1: Dependency Discovery Toolchain

Decision: Use a three-signal baseline for discovery: `npm outdated`, `npm audit --audit-level=moderate`, and `npx npm-check-updates` (NCU) in report-first mode.

Rationale:
- Matches the feature request and constitution dependency requirements.
- Combines supportability (`outdated`), vulnerability data (`audit`), and available upgrade targets (`ncu`).
- Works with existing npm-based workflow and current CI/runtime constraints.

Alternatives considered:
- Renovate-only discovery: rejected because this spec requires immediate local evidence generation.
- `pnpm`/`yarn` tooling: rejected because repository standard is npm.

## Decision 2: Upgrade Risk Classification

Decision: Classify each candidate as `patch`, `minor`, `major`, plus `security-critical` override when audit severity is moderate or higher.

Rationale:
- Semantic version class is objective and quickly triaged.
- Security override keeps remediation urgency aligned with constitution rules.
- Supports clear disposition records for approved/deferred updates.

Alternatives considered:
- Single binary safe/unsafe classification: rejected as too coarse for planning.
- Custom weighted risk score: rejected for extra complexity without stronger decision value.

## Decision 3: Unused Dependency and Dead-Code Detection

Decision: Use layered evidence: TypeScript compiler/ESLint signals first, then targeted static analysis tooling (`npx knip`) for unused files/exports/dependencies, with manual verification before removal.

Rationale:
- Existing strict compiler/lint setup already catches a subset of dead code.
- Knip is TypeScript-aware and can detect dependency and export/file reachability gaps.
- Manual verification prevents accidental removal of dynamically referenced code paths.

Alternatives considered:
- `depcheck`: rejected due weaker modern TypeScript/ESM coverage.
- Regex/import grep only: rejected because it misses transitive and config-based references.

## Decision 4: Documentation Truth Verification

Decision: Build a documentation assertion matrix mapping each actionable claim (commands, options, scripts, generated outputs, ownership boundaries) to source-of-truth files and verification status.

Rationale:
- Provides auditability for FR-007/FR-008 and SC-005.
- Reduces subjective doc edits by requiring explicit source mapping.
- Supports clean defer/archive decisions with rationale.

Alternatives considered:
- Manual ad hoc doc edits: rejected because coverage and traceability are difficult to prove.
- Full docs rewrite: rejected as unnecessary and high-risk for introducing new inaccuracies.

## Decision 5: Constitution Amendment for No Dead Code

Decision: Add an explicit no-dead-code policy clause under constitution quality standards with enforceable checks: remove or justify retention, and verify with lint/test/build gates.

Rationale:
- Directly satisfies FR-006.
- Aligns governance with ongoing hygiene expectations.
- Keeps policy testable using existing CI controls.

Alternatives considered:
- Keep policy implicit in existing quality language: rejected because requirement calls for explicit clause.
- Add policy in README only: rejected because governance authority is the constitution.
