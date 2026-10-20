# Node 26 minimum

**Tier**: Feature
**Status**: Complete
**Ratified**: User approved Feature tier and full execution on 2026-10-20.

## Product Owner TL;DR
Require Node 26 consistently and validate compatibility before a separate major release.

## Intent
Raise the supported runtime contract from Node 22.22.2 to Node 26.0.0. Preserve TypeScript 6 tooling and TypeScript 7 compilation. Do not publish or change the package version in this work.

## Acceptance Criteria
1. Package and lockfile engines, runtime validation, project metadata, current documentation, and workflow examples require Node >=26.0.0.
2. CI tests Node 26.0.0 and latest 26.x across the existing operating systems; ancillary jobs use 26.x. Runtime boundary tests reject Node 25 and accept Node 26 and newer.
3. Build, typecheck, lint, coverage, CLI smoke checks, and package validation pass on Node 26; any pre-existing failures are reported explicitly.
4. Release remains separate; rollback restores the previous runtime configuration before publication. No new dependencies or analytics changes.

## Tasks
- [X] T1 Add and run runtime boundary tests before implementation; four expected failures confirmed the old minimum.
- [X] T2 Update runtime metadata, validation, workflows, and current docs; 52 validation tests pass.
- [X] T3 Run compatibility and packaging checks and record outcomes in validation.md.

## Backbone
No metrics, Git execution, HTML, or dependency changes. Existing enforced metric provenance remains unaffected. Tests precede implementation.

## Open Questions
None.

## Waivers
None.
