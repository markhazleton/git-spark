---
id: ps-003
title: Timezone-consistent day and hour buckets
status: proposed
order: 30
depends_on: []
blockers: []
delivery: []
---

# ps-003: Timezone-consistent day and hour buckets

## Outcome

Every per-day and per-hour figure uses the analysis timezone (`--timezone` or config, default
`America/Chicago`), and the same commit lands in the same day everywhere in a report, whatever
timezone the machine running git-spark uses.

## Current Reality

- Daily trends convert with `new Date(date.toLocaleString('en-US', { timeZone }))` and then take
  `toISOString()` as the day key (`src/core/daily-trends-helpers.ts:11-14`,
  `src/core/daily-trends.ts:168-169`). The round trip is only correct on a UTC machine. Verified on an
  `America/Chicago` machine: a commit at 8 pm Chicago time on 2026-11-21 is bucketed as 2026-11-22.
  On a developer laptop, every evening commit moves to the next day.
- Author work patterns (hour of day, weekend, after hours) use `Date.getHours()`/`getDay()` in the
  machine's timezone and ignore `--timezone` (`src/core/analyzer.ts:410-422`). The same repository
  gives different patterns locally and in CI.
- The timeline buckets by UTC date (`analyzer.ts:1249,1270`), which disagrees with daily trends.

## Scope and Independence

In scope: one timezone-aware day/hour helper built on `Intl.DateTimeFormat#formatToParts` (no new
dependency), used by daily trends, author work patterns, and the timeline. Out of scope: per-author
timezones taken from commit offsets (a possible later option).

Standalone: no output schema change; values become correct and consistent.

## Future Health

Removes the "would use date-fns-tz in production" placeholder comment. A single helper lets a later
"author's local time" option be a one-line switch.

## Dependencies and Decisions

Decide whether hour-of-day patterns should use the analysis timezone (consistent, recommended) or each
commit's own offset (closer to the author's clock). Record the choice in the metric's limitations.

## Completion Expectations

Tests run with `TZ` set to a non-UTC zone and show identical day keys and hour buckets to a UTC run.
Daily trends and the timeline agree on per-day commit counts.
