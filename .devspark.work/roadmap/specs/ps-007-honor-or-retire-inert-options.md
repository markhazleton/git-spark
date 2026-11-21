---
id: ps-007
title: Honor or retire inert options
status: proposed
order: 70
depends_on: []
blockers: []
delivery: []
---

# ps-007: Honor or retire inert options

## Outcome

Every CLI flag and `.git-spark.json` key either changes the report or is gone, and users can exclude
bot accounts from analysis.

## Current Reality

`git-spark init` writes, and the CLI accepts, settings that nothing reads:

- `--heavy` and `--no-cache` are copied into options (`src/cli/commands.ts:262-264`) but no analysis
  reads `heavy` or `noCache`, and no cache exists.
- `analysis.excludePaths`, `analysis.excludeAuthors`, `analysis.includeAuthors`,
  `analysis.thresholds.*`, `analysis.weights.*`, and `performance.*` are in the default and generated
  config (`src/index.ts:218-474`, `src/cli/commands.ts:570-596`) but are never applied. Thresholds are
  hard-coded instead, for example large commit `> 500` (`src/core/analyzer.ts:1296`).
- `--author` rejects bot names such as `github-actions[bot]` because `[` and `]` are refused
  (`src/utils/input-validation.ts:74`). Bots therefore cannot be included or excluded. The 2026-11-21
  repo story counted 14 of 134 commits from automation in this repository.

## Scope and Independence

In scope: implementing `excludeAuthors` (config plus an `--exclude-authors` flag) with bracket-safe
matching; applying `excludePaths` and the thresholds the analyzer already hard-codes; removing
`--heavy`, `--no-cache`, `performance.*`, and the unused `weights` and `includeAuthors`, with a
deprecation warning for one minor version; and making `init` write only live keys. Out of scope:
building a cache.

Standalone: each removal keeps accepting the old input with a warning, so existing configs and
scripts do not break.

## Future Health

A config whose keys are all live is safe to extend. Keep the warning list in one place so the removals
can be completed in the next major version.

## Dependencies and Decisions

Decide per key: implement or retire. The recommendation above implements the cheap, useful ones
(`excludeAuthors`, `excludePaths`, thresholds) and retires the rest. Removing flags is a minor-version
change with warnings and a major-version removal.

## Completion Expectations

A test asserts every key in the generated config affects output or triggers a deprecation warning.
Excluding `github-actions[bot]` removes its commits from every section.
