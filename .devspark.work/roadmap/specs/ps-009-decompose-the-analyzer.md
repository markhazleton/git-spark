---
id: ps-009
title: Decompose the analyzer
status: proposed
order: 90
depends_on: []
blockers: []
delivery: []
---

# ps-009: Decompose the analyzer

## Outcome

Analysis is split into focused modules (repository stats, authors, files and risk, governance,
team score) that can each be read and tested on their own, with no behavior change.

## Current Reality

`src/core/analyzer.ts` is 2,597 lines, five times the 500-line threshold cited when the HTML output
modules were decomposed (issues #5, #6, #9, closed 2026-05-11). It holds data flow, every metric, and
the limitations text. ps-002 through ps-007 all edit it, and identity and timezone logic is currently
duplicated across its sections.

## Scope and Independence

In scope: moving existing methods into modules behind the current `GitAnalyzer` API, with identical
report output. Out of scope: metric changes. Those belong to their own PS.

Standalone: the public API and the JSON report are byte-for-byte unchanged on a fixed repository.

## Future Health

Makes later metric work reviewable. It is only worth doing as its own outcome if several of ps-002
to ps-007 are still ahead; otherwise each of those should leave its section cleaner as it goes.

## Dependencies and Decisions

Best scheduled after ps-003 and ps-005, which settle the shared timezone and scoring helpers the
modules would import. Decide whether to do it at all once those land.

## Completion Expectations

A golden-report test (JSON for a fixed fixture repository) passes before and after. No module exceeds
500 lines.
