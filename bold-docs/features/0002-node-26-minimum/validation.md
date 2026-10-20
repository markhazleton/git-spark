# Validation

Node 26 compatibility passes locally on Windows. Cross-platform execution remains for the configured GitHub CI matrix after these changes are pushed.

- Node 26.7.0: all 24 suites / 338 tests pass with coverage. Statements 92.64%, branches 78.71%, functions 93.78%, lines 94%; all configured thresholds pass.
- Official Node 26.0.0 Windows binary: all 24 suites / 338 tests pass with coverage after restoring a clean installation. Runtime boundary tests cover Node 22, 24, 25, prerelease 26, stable 26, and future stable 27.
- Node 26.0.0: build, typecheck:fast, lint, publint, and CLI version/help smoke checks pass.
- Node 26.7.0: build, typecheck:fast, lint, publint, and CLI version/help smoke checks pass.
- npm ci --ignore-scripts --no-audit --no-fund succeeds. The first attempt overlapped the test process and encountered a locked Windows native module; it interrupted that run. Both installation and the minimum-runtime coverage run were repeated successfully in sequence.
- Package and lockfile root engines match >=26.0.0. All locked dependency Node engine ranges accept 26.0.0. No dependency versions changed.
- Production lockfile audit: zero vulnerabilities. The known development-only sprintf-js advisory remains outside this runtime change; full security CI may still fail on it.
- CLI validate prints a repository-validation warning followed by environment success; this existing behavior is not used as evidence that repository analysis passes.
- git diff --check passes. Historical feature artifacts remain unchanged. Existing stale ADR references are deferred to harvest.

Version bump and publication are deferred. Release must separately communicate removal of Node 22/24/25 support.
