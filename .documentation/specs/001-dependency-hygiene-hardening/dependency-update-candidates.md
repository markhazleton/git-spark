# Dependency Update Candidates

| Package | Type | Current | Target | Semver Impact | Security Severity | Source Signals | Disposition | Rationale | Validation |
|---------|------|---------|--------|---------------|-------------------|----------------|-------------|-----------|------------|
| @types/node | devDependency | 25.5.0 | 25.6.0 | minor | none | npm-outdated,ncu | apply-now | Type definition update only; low runtime risk. | passed |
| @typescript-eslint/eslint-plugin | devDependency | 8.57.2 | 8.58.2 | minor | none | npm-outdated,ncu | apply-now | Lint tooling update within same major line. | passed |
| @typescript-eslint/parser | devDependency | 8.57.2 | 8.58.2 | minor | none | npm-outdated,ncu | apply-now | Parser update matched with plugin update to keep tooling aligned. | passed |
| eslint | devDependency | 10.1.0 | 10.2.1 | minor | none | npm-outdated,ncu | apply-now | Lint runner update in same major line; lint command remains green. | passed |
| prettier | devDependency | 3.8.1 | 3.8.3 | patch | none | npm-outdated,ncu | apply-now | Patch-level formatter update with no config changes. | passed |
| ts-jest | devDependency | 29.4.6 | 29.4.9 | patch | none | npm-outdated,ncu | apply-now | Patch update; Jest test suite passes. | passed |
| typedoc | devDependency | 0.28.18 | 0.28.19 | patch | none | npm-outdated,ncu | apply-now | Patch update for docs generation tooling. | passed |
| typescript | devDependency | 6.0.2 | 6.0.3 | patch | none | npm-outdated,ncu | apply-now | Patch compiler update; project builds successfully. | passed |

## Notes

- Source signals: `npm-outdated`, `npm-audit`, `ncu`.
- Disposition values: `apply-now`, `defer`, `reject`.
- Validation values: `pending`, `passed`, `failed`.
- Deferred/rejected majors: none identified in this run.
