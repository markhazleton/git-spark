## Summary

<!-- What does this PR do? One or two sentences. -->

## Type of Change

- [ ] `feat` – New feature
- [ ] `fix` – Bug fix
- [ ] `refactor` – Code restructuring (no behavior change)
- [ ] `docs` – Documentation only
- [ ] `test` – Tests only
- [ ] `chore` – Build, tooling, dependencies
- [ ] `ci` – CI/CD changes

## Changes

<!-- Bullet list of what changed and why. -->

## Testing

- [ ] Existing tests pass (`npm test`)
- [ ] New tests added for new/changed behavior
- [ ] Coverage thresholds maintained (Branches ≥75%, Functions ≥87%, Lines ≥86%)

## Analytical Integrity (if adding metrics)

- [ ] Metric derives from Git commit metadata only (no guessing)
- [ ] Naming reflects data source (e.g. `commitTimePattern` not `workingHours`)
- [ ] `limitations` object included with `dataSource`, `knownLimitations[]`, `recommendedApproach`

## Security (if modifying HTML output or Git commands)

- [ ] New template variables are HTML-escaped via `escapeHtml()`
- [ ] New inline scripts have CSP hash updated in `generateHTML()`
- [ ] Git commands use `spawn()` with argument arrays (no shell string concatenation)

## Related Issues

<!-- Closes #<issue_number> -->
