---
id: ps-005
title: Accurate commit message scoring
status: proposed
order: 50
depends_on: []
blockers: []
delivery: []
---

# ps-005: Accurate commit message scoring

## Outcome

The governance score rewards the commit practices it claims to measure, and no longer penalizes
detailed commit messages.

## Current Reality

- The length rule (10 to 72 characters earns 0.15) is applied to the whole message, subject plus
  body (`src/core/analyzer.ts:1469`, message built at `src/core/collector.ts:310`). Any commit with a
  body fails it. In this repository 107 of 222 non-merge commits have a body and lose the points.
- The conventional-commit pattern does not accept breaking-change markers (`feat!:`, `feat(api)!:`)
  or the `revert` type (`src/utils/validation.ts:299`).
- WIP detection matches `wip` anywhere, including "wipe" and "swipe" (`validation.ts:303`).
  Traceability counts the words "fixes", "closes", or "resolves" anywhere, even without an issue
  reference (`validation.ts:302`).
- Governance weights in config (`analysis.weights.governance`) are not used; the weights are
  hard-coded (`analyzer.ts:1467-1471`).

## Scope and Independence

In scope: applying the length rule to the subject line, matching the Conventional Commits 1.0 header
grammar, word-boundary WIP detection, and requiring an actual reference for traceability. Out of
scope: honoring config weights (ps-007 decides whether those keys stay).

Standalone: the score changes value, not shape. The governance section's limitations text describes
the rules exactly.

## Future Health

Moves the scoring rules next to `validateCommitMessage` so the rules and the score cannot drift.

## Dependencies and Decisions

The score will rise for well-documented repositories. Call this out in the CHANGELOG so users
comparing scores across versions are not misled.

## Completion Expectations

Table-driven tests cover subject length with and without a body, `feat!:`, `revert:`, "wipe", and
"fixes the build" without an issue reference.
