---
id: ps-002
title: Correct contributor identity
status: proposed
order: 20
depends_on: []
blockers: []
delivery: []
---

# ps-002: Correct contributor identity

## Outcome

One person counts as one contributor, and co-authored commits are recognized. Contributor counts, bus
factor, and author profiles then match how a team would describe itself.

## Current Reality

- The collector reads raw `%an`/`%ae` (`src/core/collector.ts:182`), so a repository's `.mailmap` is
  ignored. Authors are keyed by email (`src/core/analyzer.ts:308,1405`). The 2026-11-21 repo story
  found one person under three email identities in this repository, which inflates contributor count
  and deflates bus-factor concentration.
- Co-author detection matches only `Co-authored-by:` exactly (`collector.ts:368`). Git trailers are
  case-insensitive; this repository has 36 commit bodies with `Co-Authored-By:` that are missed versus
  13 detected.
- File ownership is keyed by author name in one place and by email elsewhere
  (`analyzer.ts:1222-1231` versus `:821`), so the same person can be split or merged depending on the
  section.

## Scope and Independence

In scope: honoring `.mailmap` (Git's `%aN`/`%aE` do this natively), case-insensitive co-author
trailers, and one identity key used consistently across analyses. Out of scope: heuristic identity
merging without a `.mailmap` (guessing would violate constitution principle 1), and bot exclusion
(ps-007).

Standalone: repositories without a `.mailmap` behave as today except for co-author detection.

## Future Health

A single identity key makes ps-006 (redaction) simpler: redact at output, never as the grouping key.

## Dependencies and Decisions

None. Document in the author section's limitations that identity follows `.mailmap`.

## Completion Expectations

A test repository with a `.mailmap` mapping two emails to one person reports one author. A
`Co-Authored-By:` trailer marks the commit co-authored. Every section uses the same author key.
