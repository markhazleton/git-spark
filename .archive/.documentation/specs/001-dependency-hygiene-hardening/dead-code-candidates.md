# Dead Code Candidates

| Candidate ID | Type | Location | Evidence | Dynamic Usage Risk | Action | Rationale | Validation |
|--------------|------|----------|----------|--------------------|--------|-----------|------------|
| D001 | workflow-config | .github/workflows/publish.yml | Initial `knip` parse error at manual validation step | low | remove | Converted single-line run to block scalar syntax so YAML parses consistently for analysis tooling. | passed |
| D002 | import-cleanup | test/cli-commands.test.ts | `knip` reported unlisted `@jest/globals` import | low | remove | File uses Jest globals; explicit import was unnecessary and removed. | passed |
| D003 | dependency | package.json (`husky`) | `knip` reports unused devDependency | medium | retain | Husky is loaded via dynamic `postinstall` script and used by `.husky/` hooks; static analyzers under-detect this path. | passed |
| D004 | export-set | src/cli/commands.ts and src/output/* | `knip` reports 22 unused exports | high | defer | Most are package/public helpers or cross-module exports; requires API-boundary review before safe removal. Owner: Mark Hazleton. Review date: 2026-05-03. Mitigation: keep behavior covered by existing test gates and revisit export-surface map in next cleanup cycle. | pending |
| D005 | exported-type | src/utils/input-validation.ts (`ValidationResult`) | `knip` reports unused exported type | medium | defer | Potential external/test usage; defer until API/export-surface review in US2 cleanup pass. Owner: Mark Hazleton. Review date: 2026-05-03. Mitigation: verify package API usage before narrowing exports. | pending |

## Notes

- Type values: `dependency`, `file`, `export`, `module`, `script`.
- Action values: `remove`, `retain`, `defer`.
- Validation values: `pending`, `passed`, `failed`.
- Knip now runs successfully after workflow YAML fix and provides actionable findings.
