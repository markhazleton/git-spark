# Dependency Hygiene Hardening Change Summary

## Updated

- Updated dev dependencies in `package.json` and `package-lock.json`:
	- `@types/node` 25.5.0 -> 25.6.0
	- `@typescript-eslint/eslint-plugin` 8.57.2 -> 8.58.2
	- `@typescript-eslint/parser` 8.57.2 -> 8.58.2
	- `eslint` 10.1.0 -> 10.2.1
	- `prettier` 3.8.1 -> 3.8.3
	- `ts-jest` 29.4.6 -> 29.4.9
	- `typedoc` 0.28.18 -> 0.28.19
	- `typescript` 6.0.2 -> 6.0.3
- Added explicit dev tooling dependencies used by scripts/workflows:
	- `audit-ci` ^7.1.0
	- `npm-check-updates` ^21.0.2
	- `publint` ^0.3.18

## Removed

- Removed unnecessary `@jest/globals` import from `test/cli-commands.test.ts`.

## Deferred

- Dead-code cleanup for 22 reported unused exports and 1 exported type deferred pending API-boundary verification.
- Candidate `husky` retained with rationale: dynamic `postinstall`/hook usage is present and static analysis is insufficient proof of unused status.

## Validation

- `npm run prebuild`: passed
- `npm run lint`: passed (warnings only)
- `npm test`: passed
- `npm run build`: passed
- `npm audit --audit-level=moderate`: passed (0 vulnerabilities)
- `npx --yes knip`: runs successfully; findings triaged in `dead-code-candidates.md`

## SC-003 Measurement

- Formula: `removed_verified_unused / total_verified_unused`
- `removed_verified_unused`: 0
- `total_verified_unused`: 0
- Result: `N/A` (no verified unused dependency candidates after rubric validation)
- Outcome: `not-applicable` for this iteration because denominator is zero; threshold evaluation deferred until at least one candidate is verified unused.

## Metadata Consistency Check

- Feature frontmatter remains consistent with execution artifacts:
  - `classification: full-spec`
  - `risk_level: medium`
  - `required_gates: checklist, analyze, critic`
- Gate artifacts present and reviewed under `.documentation/specs/001-dependency-hygiene-hardening/gates/`.
