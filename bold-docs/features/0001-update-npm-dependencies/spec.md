# Update npm dependencies to latest safe versions

> **TL;DR for the Product Owner**
> *What*: Bring devDependencies and type packages current, and clear the npm audit findings.
> *Why*: Keep tooling patched (security advisories in transitive deps) and reduce drift from upstream before it compounds into a harder future upgrade.
> *Status*: Complete — dependencies updated and verified.
> *Decision needed*: none — `typescript` 6→7 remains deferred because the current `@typescript-eslint` parser peer range is `<6.1.0`; `npm-check-updates` 22→23 remains deferred on Node 25 because its engine range excludes that runtime.

**Tier**: Quick
**Status**: Complete

## Intent

`ncu`, `npm outdated`, and `npm audit` surfaced direct dependency drift plus audit advisories in transitive dependencies. This work applies the verified updates and audit fixes, aligns the package Node floor with updated runtime dependencies, then verifies install, build, lint, tests, audit, outdated, ncu, and package dry-run checks. `typescript` remains on 6.x because `@typescript-eslint/parser@8.67.0` requires `typescript >=4.8.4 <6.1.0`. `npm-check-updates` remains on 22.x because 23.x excludes the current Node 25 runtime.

## Acceptance Criteria

- [X] `package.json`/`package-lock.json` reflect the updated versions for: `chalk`, `commander`, `@types/node`, `@types/semver`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint`, `prettier`, `publint`, `ts-jest`
- [X] `npm audit` reports 0 vulnerabilities (or any remaining ones are documented as unfixable without a breaking change)
- [X] `npm run build` succeeds
- [X] `npm run lint` passes with zero errors
- [X] `npm test` passes with coverage thresholds met (branches ≥75%, functions ≥87%, lines ≥86%)
- [X] `typescript` stays on `^6.0.3` and `npm-check-updates` stays on `^22.2.9` with the incompatibilities documented
- [X] Node runtime metadata is aligned to `>=22.12.0`

## Affected Files

- `package.json`
- `package-lock.json`
- `.nvmrc`
- `README.md`
- `src/utils/validation.ts`
- `test/index.test.ts`

## Tasks

- [X] T1: Run `npm audit fix` to resolve the 4 transitive-dependency advisories (`@babel/core`, `js-yaml`, `linkify-it`, `markdown-it`)
- [X] T2: Update direct dependencies with `ncu -u`, then keep incompatible toolchain updates (`typescript@7`, `npm-check-updates@23`) deferred
- [X] T3: Run `npm run build`, `npm run lint`, `npm test` and confirm all pass
- [X] T4: Re-run `npm outdated`, `ncu`, and `npm audit` to confirm the intended end state
- [X] T5: Stabilize the slow quick-analysis test so the full suite passes after dependency updates
