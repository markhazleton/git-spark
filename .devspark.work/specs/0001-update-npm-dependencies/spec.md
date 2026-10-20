# Update npm dependencies to latest safe versions

> **TL;DR for the Product Owner**
> *What*: Bring devDependencies and type packages current, and clear the npm audit findings.
> *Why*: Keep tooling patched (security advisories in transitive deps) and reduce drift from upstream before it compounds into a harder future upgrade.
> *Status*: Complete — dependencies updated and verified.
> *Decision needed*: none — `typescript` 7 is now the build compiler (installed as the `typescript7` alias), while `typescript` resolves to `@typescript/typescript6` because `@typescript-eslint`, `ts-jest`, and `typedoc` still require the TS 6 JS API, which TS 7 no longer ships.

**Tier**: Quick
**Status**: Complete

## Intent

`ncu`, `npm outdated`, and `npm audit` surfaced direct dependency drift plus audit advisories in transitive dependencies. This work applies the verified updates and audit fixes, aligns the package Node floor with updated runtime dependencies, then verifies install, build, lint, tests, audit, outdated, ncu, and package dry-run checks. TypeScript 7 (the Go-native compiler) builds the project; it ships no classic JS API, so `@typescript-eslint` (peer `<6.1.0`), `ts-jest` (`<7`), and `typedoc` (`6.0.x`) keep using TS 6 through `@typescript/typescript6`.

## Acceptance Criteria

- [X] `package.json`/`package-lock.json` reflect the updated versions for: `chalk`, `commander`, `@types/node`, `@types/semver`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint`, `prettier`, `publint`, `ts-jest`
- [X] `npm audit` reports 0 vulnerabilities (or any remaining ones are documented as unfixable without a breaking change)
- [X] `npm run build` succeeds
- [X] `npm run lint` passes with zero errors
- [X] `npm test` passes with coverage thresholds met (branches ≥75%, functions ≥87%, lines ≥86%)
- [X] `build`, `build:watch`, and `typecheck:fast` compile with TypeScript 7 (`typescript7` → `typescript@^7.0.2`); `typescript` aliases `@typescript/typescript6@^6.0.2` for API-consuming tools; `@typescript/native-preview` removed
- [X] CI type-check step runs TypeScript 7 and is blocking
- [X] `npm run docs` writes to `api-docs/` (gitignored) instead of overwriting the `docs/` GitHub Pages site
- [X] Node runtime metadata is aligned to `>=22.22.2`

## Affected Files

- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `.gitignore`
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
- [X] T6: Adopt TypeScript 7 for compilation alongside the TS 6 API package; point build scripts at `typescript7/bin/tsc` explicitly (the bare `tsc` bin is claimed by the TS 6 package's nested `typescript@6`); make CI type-check blocking
- [X] T7: Redirect `typedoc` output to `api-docs/` so `npm run docs` no longer clobbers the Pages site in `docs/`

When `@typescript-eslint`, `ts-jest`, and `typedoc` support TS 7, set `typescript` back to `^7.0.2`, drop `typescript7`, and revert the scripts to plain `tsc`.
