# AGENTS.md

## Project Guidance

- Read `.knowledge/governance/constitution.md` before doing any work.
- Read `.knowledge/reference/tech-stack.md` and `.knowledge/reference/project.json` for project facts and quality gates.
- `.archive/` is committed, human-only history. Never read, list, search, or glob it, even when directly referenced.
- Preserve the Node.js >=26.0.0 requirement and existing TypeScript 6 tooling / TypeScript 7 compiler split.

## DevSpark

- Framework files live in `.devspark/`; the installed version is recorded in `.devspark/VERSION`.
- Temporary plans and team overrides live in `.devspark.work/`; durable project knowledge lives in `.knowledge/`.
- Codex command entry points live in `.codex/prompts/devspark-<name>.md`.
- Normalize `git config user.name` to lowercase, replace spaces with hyphens, and strip other non-alphanumeric/hyphen characters to obtain `{git-user}`.
- Resolve commands through the first existing file:
  1. `.devspark.work/{git-user}/commands/devspark.{name}.md`
  2. `.devspark.work/commands/devspark.{name}.md`
  3. `.devspark/defaults/commands/devspark.{name}.md`
- Preserve user work in `.devspark.work/` and `.knowledge/`; upgrades refresh framework files only.
- Start commands only when explicitly invoked with a leading slash, such as `/devspark-specify`.
