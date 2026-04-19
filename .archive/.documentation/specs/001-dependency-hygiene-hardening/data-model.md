# Data Model: Dependency Hygiene Hardening

## Entity: DependencyUpdateCandidate

Description: A package-level upgrade candidate discovered from audit/outdated/NCU signals.

Fields:
- packageName (string, required)
- dependencyType (enum: dependencies|devDependencies|peerDependencies|optionalDependencies)
- currentVersion (string, required)
- targetVersion (string, required)
- semverImpact (enum: patch|minor|major)
- securitySeverity (enum: none|low|moderate|high|critical)
- sourceSignals (string[], required) - e.g. `npm-outdated`, `npm-audit`, `ncu`
- disposition (enum: apply-now|defer|reject, required)
- dispositionReason (string, required when disposition != apply-now)
- validationStatus (enum: pending|passed|failed)

Validation rules:
- `targetVersion` must differ from `currentVersion`.
- `securitySeverity` of moderate+ requires either `apply-now` or explicit documented mitigation rationale.
- `dispositionReason` is mandatory for deferred/rejected candidates.

State transitions:
- discovered -> triaged -> applied|deferred|rejected -> validated

## Entity: DeadCodeCandidate

Description: Candidate dependency, file, symbol, or path identified as unused or unreachable.

Fields:
- candidateId (string, required)
- candidateType (enum: dependency|file|export|module|script)
- location (string, required)
- evidenceSource (string[], required) - compiler, eslint, knip, manual trace
- dynamicUsageRisk (enum: low|medium|high)
- action (enum: remove|retain|defer, required)
- actionReason (string, required)
- validationStatus (enum: pending|passed|failed)

Validation rules:
- `remove` actions require successful lint/test/build validation.
- `retain` actions require explicit rationale and follow-up owner/date.

State transitions:
- flagged -> verified -> removed|retained|deferred -> validated

## Entity: DocumentationAssertion

Description: A documentation statement mapped to source-of-truth evidence.

Fields:
- assertionId (string, required)
- documentPath (string, required)
- assertionText (string, required)
- sourceOfTruth (string, required) - file/command that validates statement
- status (enum: valid|corrected|removed|deferred)
- owner (string, required for deferred)
- rationale (string, optional)

Validation rules:
- `deferred` status must include owner and rationale.
- `removed` status should point to replacement or archival path when applicable.

State transitions:
- discovered -> checked -> valid|corrected|removed|deferred

## Entity: ConstitutionPolicyClause

Description: Governance clause defining no-dead-code policy and compliance checks.

Fields:
- clauseId (string, required)
- section (string, required)
- policyText (string, required)
- enforcementMechanism (string[], required) - lint/test/build/review checklist
- effectiveDate (date, required)
- amendmentVersion (string, required)

Validation rules:
- Policy text must be explicit, testable, and non-contradictory with existing constitution principles.
- Enforcement mechanisms must map to actual repository checks.

State transitions:
- drafted -> reviewed -> ratified -> enforced

## Relationships

- One DependencyUpdateCandidate may produce zero or more DeadCodeCandidate records.
- DeadCodeCandidate validation can trigger DocumentationAssertion updates when behavior/documentation changes.
- ConstitutionPolicyClause informs acceptance criteria and checklist validation across all candidate entities.
