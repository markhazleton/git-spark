# Quickstart: Dependency Hygiene Hardening

## Goal

Execute a safe dependency and dead-code hygiene pass with validated outcomes and accurate documentation.

## Prerequisites

- Node.js >=20.19.0
- npm >=10.0.0
- Clean working tree (recommended)

## 1. Baseline Discovery

Run from repository root:

```bash
npm outdated
npm audit --audit-level=moderate
npx npm-check-updates
npx knip
```

Capture findings into:
- Dependency update candidates
- Dead code candidates
- Security findings

## 2. Triage and Plan Changes

For each dependency candidate:
- classify semver impact (`patch`, `minor`, `major`)
- mark security severity (`none`, `low`, `moderate`, `high`, `critical`)
- choose disposition (`apply-now`, `defer`, `reject`) with rationale

For each dead-code candidate:
- verify static signal is legitimate
- assess dynamic usage risk
- choose action (`remove`, `retain`, `defer`) with rationale

## 3. Apply Approved Changes

- Update approved dependencies.
- Remove approved unused dependencies/files/exports.
- Keep deferred or risky items documented with owner and reason.

## 4. Validate Quality Gates

```bash
npm run prebuild
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
```

All required checks must pass before merge.

## 5. Reconcile Documentation and Constitution

- Update README/docs/process docs to match actual behavior.
- Respect boundary: `docs/` is CI-owned public site output; internal workflow docs stay under `.documentation/`.
- Add explicit no-dead-code policy clause to constitution and reference it in implementation checklist/tasks.

## 6. Produce Change Summary

Summarize:
- packages updated and risk class
- vulnerabilities fixed or mitigated
- dependencies/code removed
- documentation corrected/removed/deferred
- deferred items with owner/reason
