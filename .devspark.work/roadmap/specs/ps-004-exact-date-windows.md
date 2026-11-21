---
id: ps-004
title: Exact date windows
status: proposed
order: 40
depends_on: []
blockers: []
delivery: []
---

# ps-004: Exact date windows

## Outcome

`--since`, `--until`, `--days`, and `periods` select exactly the commits a user expects: whole days
from the start of `--since` through the end of `--until`, independent of the time of day the command
runs.

## Current Reality

- Git reads a bare `YYYY-MM-DD` as that date at the current time of day (the reason for the PR #19-era
  first-commit fix in `src/core/collector.ts:137-142`). Bare dates are still passed through for
  `--since`/`--until`, so `--since 2026-11-01 --until 2026-11-21` run at 9 am drops commits before
  9 am on Nov 1 and after 9 am on Nov 21.
- `--days` derives a bare UTC date (`collector.ts:122-128`), so the window shifts with clock time and
  UTC offset. `periods` does the same for its lookback start (`src/cli/periods-command.ts:71`).
- `--since X --until X` (a single day) is rejected as "Since date must be before until date"
  (`src/utils/validation.ts:43-48`).

## Scope and Independence

In scope: expanding bare dates to explicit start-of-day and end-of-day timestamps in the analysis
timezone, `--days N` as an exact timestamp offset, allowing single-day ranges, and stating the
resolved window in report metadata. Out of scope: new relative-date syntax.

Standalone: CLI syntax is unchanged; results become deterministic.

## Future Health

Uses the timezone helper from ps-003 if it has shipped; otherwise uses the same `Intl` approach so the
two converge. Keeps `options` immutable rather than mutating `options.since` (`collector.ts:126,142`),
which the current regression test relies on and should check through metadata instead.

## Dependencies and Decisions

No hard dependency. Ship ps-003 first if both are planned, so both use one timezone helper.

## Completion Expectations

Tests at fixed fake clock times (morning, evening, across a UTC date change) return the same commits
for the same window. A single-day range is accepted. The report shows the resolved window.
