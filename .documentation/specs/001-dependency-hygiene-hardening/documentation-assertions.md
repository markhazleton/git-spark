# Documentation Assertions Matrix

| Assertion ID | Document | Assertion | Source of Truth | Status | Owner | Rationale |
|--------------|----------|-----------|-----------------|--------|-------|-----------|
| A001 | README.md | CLI options and command examples match implemented commands and scripts. | `src/cli/commands.ts`, `package.json` scripts | corrected | n/a | Corrected a malformed heading while validating command guidance consistency. |
| A002 | docs/performance-tuning.md | Performance recommendations align with current CLI flags and config keys. | `README.md` CLI options, `.git-spark.json` conventions, `src/cli/commands.ts` | valid | n/a | Existing guidance reflects current analysis controls (`--days`, `--since`, `--branch`, `--exclude-extensions`). |
| A003 | CONTRIBUTING.md | Contributor workflow, layer boundaries, and quality gates reflect current repository behavior. | `.husky/pre-commit`, `.husky/pre-push`, `package.json`, `src/` structure | valid | n/a | Build/test/lint workflow and architecture descriptions are accurate. |
| A004 | SECURITY.md | Vulnerability reporting and security controls match current implementation and policy. | `src/utils/git.ts`, `src/utils/input-validation.ts`, GitHub advisory URL, audit scripts in `package.json` | valid | n/a | Security reporting path and technical mitigations are still current. |
| A005 | Internal docs lifecycle | No stale internal guidance requiring archive/removal was identified in this pass. | `.documentation/` feature artifacts reviewed during T026-T032 | valid | n/a | No obsolete internal feature guidance detected for archival/removal. |

## Notes

- Status values: `valid`, `corrected`, `removed`, `deferred`.
- `Owner` is required when status is `deferred`.
