---
id: ps-006
title: Complete, collision-free email redaction
status: proposed
order: 60
depends_on: []
blockers: []
delivery: []
---

# ps-006: Complete, collision-free email redaction

## Outcome

`--redact-emails` (or `output.redactEmails` in config) produces reports in every format that contain
no author email address, without merging different people into one.

## Current Reality

- The root command declares `--redact-emails` but never copies it into `GitSparkOptions`
  (`src/cli/commands.ts:251-268`), and the `html` subcommand has no such option. Verified: a JSON
  report generated with the flag still contains full addresses. Only the config key works
  (`src/utils/config.ts:109-111`).
- Redaction is applied as the grouping key: `sanitizeEmail` keeps the first letter and the domain
  (`src/utils/validation.ts:272-281`), and authors are grouped by the redacted value
  (`src/core/analyzer.ts:359-363`). `mark@example.com` and `mike@example.com` become one author.
- Redaction is applied in the author list and file authors only. Other paths use the raw email, for
  example daily-trends contributor data (`src/core/daily-trends-helpers.ts:62`).

## Scope and Independence

In scope: wiring the flag on the root and `html` commands, grouping by real identity and redacting at
output, and a check that no email pattern appears in any output format when redaction is on. Out of
scope: redacting names.

Standalone: fixes a privacy promise without depending on other items.

## Future Health

If ps-002 has shipped, redact its single identity key at output. If not, this PS introduces the
"group by real, display redacted" rule that ps-002 then keeps.

## Dependencies and Decisions

Decide the redacted form: keep `m***@example.com`, or use a stable per-run alias such as
`author-3@example.com` that cannot collide.

## Completion Expectations

A test generates every format with redaction on from a repository with two same-initial,
same-domain authors. It finds no email address and two distinct authors.
