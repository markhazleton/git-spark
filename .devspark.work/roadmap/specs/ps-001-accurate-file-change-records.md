---
id: ps-001
title: Accurate per-file change records
status: proposed
order: 10
depends_on: []
blockers: []
delivery: []
---

# ps-001: Accurate per-file change records

## Outcome

Every file change in a report names the real file and its real change status. Hotspots, risk
scores, file counts, file-type breakdowns, and author file ownership then describe files that exist.

## Current Reality

- `git log --numstat` reports renames in brace form, for example
  `{.devspark.work => .archive/2026-10-20}/specs/.../spec.md`. `parseFileStats` splits on ` => `, so
  the recorded path becomes `.archive/2026-10-20}/specs/.../spec.md` and the old path becomes
  `{.devspark.work` (`src/core/collector.ts:336-340`). In this repository 110 of 134 rename lines use
  brace form, so most renames produce corrupted paths.
- Status is guessed from line counts: any change with insertions and no deletions is `added`, and any
  with deletions and no insertions is `deleted` (`collector.ts:341-345`). An edit that only appends
  lines is reported as a new file.

## Scope and Independence

In scope: correct path and old-path expansion for both brace and plain rename forms, and change status
taken from Git (added, modified, deleted, renamed) rather than inferred. Out of scope: following
history across renames (`--follow`) and merging a renamed file's stats with its old path.

Standalone: the collector's `FileChange` contract is unchanged in shape; only its values become
correct. Shipping this alone leaves every report more accurate.

## Future Health

Keeps one `git log` invocation (Git can emit `--numstat` together with `--raw` or `--name-status`).
Leaves room for later rename-aware history without changing the contract again.

## Dependencies and Decisions

None. Decide whether the JSON `status` change is a fix (patch) or a behavior change (minor) at
release; it changes values, not the schema.

## Completion Expectations

A regression test with a brace-form rename and an append-only edit shows the correct path, old path,
and status. On this repository no recorded path contains `{` or `}` unless the real filename does.
