---
id: ps-008
title: Multiple and exclude path filters
status: proposed
order: 80
depends_on: []
blockers: []
delivery: []
---

# ps-008: Multiple and exclude path filters

## Outcome

Users can scope an analysis to several paths and exclude others in one run, for example "`src` and
`test`, but not `src/generated`".

## Current Reality

Since PR #19, `--path` accepts a single Git pathspec glob (`src/core/collector.ts:190`). Git supports
several pathspecs and `:(exclude)` / `:!` magic, but the CLI accepts one value, and `validatePathString`
rejects `(`, `)`, and `!`-style magic as unsafe characters (`src/utils/input-validation.ts:143`).
Excluding a directory today needs `--exclude-extensions` (extensions only) or `.gitignore` (current
files only).

## Scope and Independence

In scope: a repeatable `--path` option, a repeatable `--exclude-path` option translated internally to
`:(exclude)` pathspecs, and validation that allows exactly those forms while still rejecting
traversal and control characters. Out of scope: arbitrary pathspec magic such as `:(icase)` or
`:(attr)`.

Standalone: a single `--path` keeps working unchanged.

## Future Health

Pathspecs stay Git's job; the CLI composes them and never evaluates patterns itself, preserving the
spawn-argument safety model (constitution principle 3).

## Dependencies and Decisions

If ps-007 implements `analysis.excludePaths`, back it with this mechanism rather than a second
matcher.

## Completion Expectations

Collector tests show `--path src --path test --exclude-path src/generated` returns exactly the commits
`git log -- src test ':(exclude)src/generated'` returns.
