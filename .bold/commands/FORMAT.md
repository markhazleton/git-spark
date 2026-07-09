# Neutral Prompt Format

The schema every file under `source/commands/` follows. Read this before writing a new command or subcommand.

## Layout

One file per subcommand: `source/commands/{plan,build,ship}/{subcommand}.md`. The bare command (`bold.plan` with no subcommand) lives at `{command}/default.md`. See `bold-docs/features/0001-neutral-prompt-format/spec.md` for why (whole-file override replacement per plan §5.3 means subcommand-level granularity, not one file per top-level command).

`source/commands/install/default.md` (`bold.install`) is a deliberate fourth entry, not a widening of the three frozen methodology verbs (§18 risk table) — it's pre-methodology bootstrap: the payload-sync step that has to exist before `plan`/`build`/`ship` are on disk to run at all. It reuses the same `bold.<verb>` frontmatter shape purely so the existing slug/adapter-generation machinery (`generate-adapters.{sh,ps1}`, `generate-site.{sh,ps1}`) needs no bespoke handling — treat the `command: bold.install` value as tooling convenience, not a claim that installation is a fourth thing Bold's methodology does.

## File shape

```markdown
---
command: bold.plan
subcommand: critic
description: One line — what this subcommand does.
collector: collect-triage-context   # or: none, with a comment explaining why
args:
  - name: --strict
    description: What the flag changes.
    values: [optional, enum, list]  # omit if free-form
---

# bold.plan critic

Agent-neutral markdown body.
```

### Frontmatter fields

| Field | Required | Notes |
|---|---|---|
| `command` | yes | `bold.plan` / `bold.build` / `bold.ship` |
| `subcommand` | yes | `default` for the bare command |
| `description` | yes | One line; this is what an adapter generator turns into the host's command description |
| `collector` | yes | The collector script's base name (no extension — both `source/scripts/bash/{name}.sh` and `source/scripts/powershell/{name}.ps1` must exist), or the literal `none` if the subcommand's only input is a file already on disk. Never omit the field — an absent collector should be a stated decision, not a gap |
| `args` | yes (may be empty `[]`) | Flags the subcommand accepts, each with a one-line `description` |

### Body

- Markdown, no host-specific syntax — no Claude Code frontmatter keys, no Copilot directives, no Cursor rule syntax. Anything host-specific belongs in `adapters/`, not here.
- Open with a short statement of purpose, then boundaries (success criteria, halt conditions) — not a scripted step-by-step procedure the model would handle sensibly on its own (backbone principle: guardrails bound the space, never script the path).
- **A `## Definition of Done` section is required.** Plan §1 is explicit: "no prompt without success criteria either... Prompts are components with contracts, not text that gets eyeballed and shipped." One to three sentences stating what "done" concretely means for this subcommand — specific enough that a different agent run against the same input would recognize the same stopping point. Not a restatement of the body's steps; a test you could check the output against afterward.
- The Product Owner TL;DR requirement (plan §8) lives in the body wherever this subcommand instructs the agent to produce a durable artifact — it's part of what the methodology produces, not adapter-injected boilerplate.
- Reference collector output fields by name (e.g. `active_features`, `backbone_principles`) rather than re-describing how to gather them — the collector already did that.

## Collector convention

Collector scripts emit single-line JSON to stdout, one pair per platform: `source/scripts/bash/{name}.sh` and `source/scripts/powershell/{name}.ps1`, verified to produce equivalent output. Shared parsing logic (feature inventory, backbone principle status, system-doc inventory) lives in `source/scripts/bash/lib/common.sh` and `source/scripts/powershell/lib/Common.ps1` — reach for those before duplicating a scan across a third script.

## Worked examples

All 14 files under `source/commands/{plan,build,ship}/` follow this schema and are the reference set — `plan/default.md` (the triage flow) is the most heavily annotated. `install/default.md` also follows it but is the one legitimate exception to the collector rule above — see its own file for why.
