# Update npm dependencies to latest safe versions

> **TL;DR for the Product Owner**
> *What*: Bring devDependencies and type packages current, and clear the npm audit findings.
> *Why*: Keep tooling patched (security advisories in transitive deps) and reduce drift from upstream before it compounds into a harder future upgrade.
> *Status*: Planning — no code written yet.
> *Decision needed*: none — major-version bumps (`commander` 14→15, `typescript` 6→7) are explicitly out of scope for this pass; they touch the CLI contract and toolchain surface broadly enough to warrant their own Feature-tier evaluation later.

**Tier**: Quick
**Status**: Complete

## Intent

`ncu`, `npm outdated`, and `npm audit` surfaced 12 packages with available minor/patch updates (all devDependencies or type-only packages) and 4 audit advisories in transitive dev dependencies. This work applies the safe updates and audit fixes, then verifies the build/lint/test suite still passes. `commander` and `typescript` have major versions available but are deliberately excluded — bumping them could change the CLI argument-parsing contract or surface new compiler errors across `src/`, which is bigger than a Quick-tier change.

## Acceptance Criteria

- [X] `package.json`/`package-lock.json` reflect the updated versions for: `@types/node`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint`, `npm-check-updates`, `ora`, `prettier`, `semver`, `ts-jest`, `typedoc`
- [X] `npm audit` reports 0 vulnerabilities (or any remaining ones are documented as unfixable without a breaking change)
- [X] `npm run build` succeeds
- [X] `npm run lint` passes with zero errors
- [X] `npm test` passes with coverage thresholds met (branches ≥75%, functions ≥87%, lines ≥86%)
- [X] `commander` stays on `^14.0.3` and `typescript` stays on `^6.0.3` (majors deferred)

## Affected Files

- `package.json`
- `package-lock.json`

## Tasks

- [X] T1: Run `npm audit fix` to resolve the 4 transitive-dependency advisories (`@babel/core`, `js-yaml`, `linkify-it`, `markdown-it`)
- [X] T2: Update the 10 minor/patch devDependencies/type packages (excluding `commander`, `typescript`) via targeted `npm install <pkg>@<version>` or scoped `ncu -u` filtered to those packages
- [X] T3: Run `npm run build`, `npm run lint`, `npm test` and confirm all pass
- [X] T4: Re-run `npm outdated` and `npm audit` to confirm the intended end state (only `commander`/`typescript` majors remaining as known-deferred)
