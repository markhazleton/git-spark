---
gate: critic
status: warn
blocking: false
severity: warning
summary: "No showstoppers detected, but dependency upgrades and dead-code removal carry predictable regression and operational risks that require strict validation sequencing."
---

## Adversarial Risk Review

| ID | Risk Category | Severity | Location(s) | Failure Mode | Mitigation |
|----|---------------|----------|-------------|--------------|------------|
| R-001 | Dependency Upgrade Hazard | HIGH | tasks.md (T013-T018) | Minor/major transitive behavior changes can break CLI/report output despite passing compile. | Keep major updates deferred by default, rerun full quality gates, and verify sample report outputs. |
| R-002 | Dead-Code False Positive | HIGH | tasks.md (T019-T021) | Knip/static signals may flag dynamically-used paths, causing runtime regressions if removed. | Require manual verification and explicit dynamic-risk classification before removal. |
| R-003 | Audit Resolution Drift | MEDIUM | tasks.md (T006,T018) | Audit findings may persist via transitive constraints after upgrades and be silently ignored. | Record residual risk and mitigation/owner for any unresolved moderate+ finding. |
| R-004 | Documentation Truth Drift | MEDIUM | tasks.md (T027-T031) | Rapid updates may produce inconsistent command guidance across multiple docs. | Use assertion matrix as single source for doc validation outcomes. |
| R-005 | CI-Owned Docs Boundary Violation | MEDIUM | plan.md, constitution.md | Internal cleanup could mistakenly archive or remove `docs/` assets. | Enforce constitution boundary: `docs/` is public CI-owned site output, not internal working docs. |

## Constitution Alignment

No constitution showstopper violations identified in spec/plan/tasks. Existing workflow is compatible with mandatory principles when gates are executed in order.

## Operational Readiness Notes

- Highest practical risk is removal of code/dependencies with hidden runtime usage.
- Second-highest risk is incomplete mitigation tracking for remaining audit findings.
- Validation commands are sufficient if executed after each risky change batch, not only once at the end.

## Next Actions

- Proceed with implementation in strict phase order (discovery -> triage -> apply -> validate -> docs).
- Treat dead-code removals as opt-in per-candidate after manual verification.
- Keep deferred update and residual vulnerability records explicit in feature artifacts.

## Shared Review Resolution Contract Output

```yaml
findings:
  - finding_id: critic-001
    severity: high
    description: "Static dead-code detection can produce false positives for dynamically referenced modules and exports."
    recommended_action: "Require per-candidate dynamic usage verification before removal and preserve rationale for retain/defer."
    execution_mode: selective
    status: open
    outcome: ""
  - finding_id: critic-002
    severity: high
    description: "Dependency upgrades can introduce transitive regressions not captured by compile-time checks alone."
    recommended_action: "Run full lint/test/build gates and verify representative CLI output after update batches."
    execution_mode: auto
    status: open
    outcome: ""
  - finding_id: critic-003
    severity: medium
    description: "Residual moderate+ vulnerabilities may remain if transitive constraints block immediate remediation."
    recommended_action: "Document mitigation, owner, and defer rationale for each unresolved audit item."
    execution_mode: manual
    status: open
    outcome: ""
```
