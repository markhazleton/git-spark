# Harness Implementation Retrospective

**Date**: 2026-04-19  
**Repository**: git-spark  
**Scope**: Document attempts to run DevSpark Harness for the dependency hygiene feature, including blockers, mitigations tried, and outcomes.

## Objective

Run a repeatable DevSpark Harness lifecycle for the feature in `.documentation/specs/001-dependency-hygiene-hardening` and produce real implementation/code changes, not just successful workflow status.

## Timeline Summary

1. A full lifecycle harness file was created and validated.
2. Initial runs succeeded only with `noop` adapter and produced no source edits.
3. Switching to `claude_code` enabled real execution but stalled at write-producing steps.
4. Hybrid routing (manual adapter for write steps) allowed the run to complete.
5. Completed status still did not guarantee source changes because manual steps were confirmed without edits.

## Issues, Resolutions Tried, and Outcomes

## Issue 1: Harness completed but no code changes

**Symptoms**
- Harness runs reported `complete`.
- No files changed under `src`, `test`, `bin`, `package.json`, `tsconfig.json`, `README.md`, `CHANGELOG.md`.
- Implement step output was effectively a confirmation-only signal.

**Root Cause**
- Default adapter was `noop` in earlier runs.
- Validations were existence/pass checks, not mutation checks.

**Resolutions Tried**
1. Run with `noop` to confirm baseline harness wiring.
2. Inspect run artifacts (`result.json`, `events.jsonl`, `steps/*/output.txt`) to verify artifact deltas.

**Outcome**
- Harness mechanics validated.
- No source implementation occurred by design.

---

## Issue 2: `copilot` adapter not actually runnable

**Symptoms**
- `devspark adapter list` reported `copilot` available.
- `copilot --version` prompted installation flow.
- `gh copilot --version` failed (`unknown command`).

**Root Cause**
- Local Copilot CLI/extension path was not fully installed/configured despite adapter visibility.

**Resolutions Tried**
1. Probed adapter/CLI commands directly.
2. Declined install prompts during diagnostics to avoid unintended environment changes.

**Outcome**
- `copilot` not usable as a reliable automation adapter in this environment.

---

## Issue 3: `claude_code` run stalled on `plan` step

**Symptoms**
- `specify` and `clarify` passed.
- `plan` stayed in `called` state with no output file.
- Events stopped at `harness.tool.called` for `claude --print`.

**Root Cause**
- Write-intent prompts required explicit permission approval from Claude.
- Harness non-interactive adapter call could not satisfy approval handshake.

**Resolutions Tried**
1. Verified `claude --print` with simple read-only prompt (worked).
2. Tested `claude --print` with real plan prompt content (returned permission request text).
3. Monitored events and process list to confirm stall behavior.

**Outcome**
- Confirmed adapter-level write permission gate causes non-interactive stall for write steps.

---

## Issue 4: Strict harness validation schema mismatches during hardening

**Symptoms**
- Validation failed after adding regex-based checks.
- Error indicated missing required fields for `regex.match` rules.

**Root Cause**
- Rule definitions did not match runtime schema expectations.

**Resolutions Tried**
1. Replaced problematic regex checks with supported deterministic checks (`file.exists`) where needed.
2. Re-validated harness after each patch.

**Outcome**
- Harness returned to valid schema and executable state.

---

## Issue 5: Manual gates passed without actual work performed

**Symptoms**
- Manual steps (`plan`, `tasks`, `implement`) showed `passed` after keypress.
- Missing artifact validation eventually failed one run (`plan.md` missing).
- Later run completed once artifacts existed, even when implement did not mutate source.

**Root Cause**
- Manual adapter semantics: pressing key marks step complete unless downstream validations fail.
- Implement validations only checked `npm test` and `npm run build`, not source mutation.

**Resolutions Tried**
1. Generated missing planning artifacts outside harness:
   - `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/*`
2. Generated `tasks.md` via tasks workflow.
3. Re-ran harness with manual gates and continued prompts.

**Outcome**
- End-to-end run reached `complete`.
- Still no guaranteed source edits due to validation design.

---

## Issue 6: Console `UnicodeDecodeError` during long run output capture

**Symptoms**
- Python thread exceptions (`cp1252` decode errors) appeared in terminal.

**Root Cause**
- Terminal output decoding mismatch while reading subprocess output containing unsupported bytes for active code page.

**Resolutions Tried**
1. Continued monitoring run artifacts rather than relying on console stream alone.
2. Used `result.json` as source of truth for completion status.

**Outcome**
- Run still completed successfully.
- Decode errors were noisy but non-fatal to final harness status.

## What Was Successfully Produced

1. Harness config file:
   - `git-spark-lifecycle.harness.yaml`
2. Feature planning artifacts:
   - `.documentation/specs/001-dependency-hygiene-hardening/plan.md`
   - `.documentation/specs/001-dependency-hygiene-hardening/tasks.md`
   - `.documentation/specs/001-dependency-hygiene-hardening/research.md`
   - `.documentation/specs/001-dependency-hygiene-hardening/data-model.md`
   - `.documentation/specs/001-dependency-hygiene-hardening/quickstart.md`
   - `.documentation/specs/001-dependency-hygiene-hardening/contracts/*`
3. Harness run records under:
   - `.documentation/devspark/runs/*`

## Remaining Blockers to Real Source Implementation

1. Adapter capability mismatch for unattended write operations.
2. Implement-step validations do not require source mutations.
3. Manual gate confirmations can advance without actual code changes.

## Recommended Next Fixes

1. Add mutation-required validations for implement step:
   - Require changed file count in `src/**` and/or `test/**`.
2. Add explicit output artifact checks for implement step:
   - Example: require at least one modified source file plus passing tests/build.
3. Keep harness as orchestrator, but execute write-heavy steps through interactive workflow where permission approvals are explicit and observable.
4. Optionally isolate `docs/index.html` unrelated change before implementation verification to reduce noise.

## Advice for DevSpark Toolkit Improvements

The following product-level enhancements would have made this session easier and more transparent.

1. Adapter readiness should verify executable behavior, not just adapter registration.
   - Add a `devspark adapter doctor` command that runs a non-interactive probe and a write-intent probe for each adapter.
   - Report explicit states: `available`, `read-only-works`, `write-approval-required`, `unusable`.

2. Harness should detect stalled tool calls and fail fast with diagnostics.
   - Add step-level timeout defaults with clear terminal reason codes.
   - Emit a structured stall event when no output is produced for a threshold interval.
   - Surface actionable suggestions (switch adapter, use manual gate, retry with different permission mode).

3. Manual gates should support evidence requirements before continuation.
   - Replace `Press any key` with policy options:
     - `confirm-only`
     - `confirm-with-file-check`
     - `confirm-with-git-diff-check`
   - Example: do not allow `implement` continuation until at least one file under `src/**` or `test/**` changed.

4. Mutation-aware validation rules should be first-class.
   - Add built-in rules such as:
     - `git.changed_count`
     - `git.changed_path_match`
     - `git.diff_contains`
   - This removes fragile shell-based workarounds and makes implementation intent testable.

5. Run status should distinguish orchestration success from implementation success.
   - Introduce dual outcomes in `result.json`:
     - `workflow_status` (steps executed)
     - `delivery_status` (required outputs and source deltas met)
   - Prevent false-positive "complete" when no implementation artifacts changed.

6. Encoding robustness should be hardened for Windows terminals.
   - Standardize subprocess stream decoding to UTF-8 with fallback handling.
   - Capture decode errors as non-fatal run events tied to step IDs, not raw thread crashes.

7. Prompt-aware adapter capability metadata should be enforced.
   - Allow steps to declare `requires_write_permission: true`.
   - Runner should auto-reject adapters that cannot satisfy this contract in current mode.

8. Provide a "strict implementation" harness template.
   - Include default gates for `plan.md`, `tasks.md`, `src/**` mutation, tests, build, and changelog updates.
   - Reduce setup friction and misconfiguration risk for teams adopting harness.

9. Improve transparency of manual step context.
   - Persist a richer `manual_context.md` per step with:
     - objective
     - required outputs
     - exact pass/fail checks
     - commands to verify completion
   - This would reduce ambiguity during manual confirmations.

10. Add a post-run "why no changes" explainer.
   - If run is complete but no source files changed, emit a summary section explaining which validations passed and why mutation was not required.
   - Include recommended next edits to the harness file.

## Final Assessment

The workflow orchestration objective was achieved (validated and repeatable runs with trace artifacts).  
The code implementation objective was **not** achieved automatically because step success criteria allowed completion without source mutation and adapter permission gates prevented unattended write execution.

## Current State and Failed Expectation

### Expected Outcome

1. `implement` would produce real source-level changes in `src/**` and/or `test/**`.
2. The flow would naturally proceed to pull request readiness (including `create-pr` stage expectations).
3. Run completion would indicate delivery progress, not only orchestration progress.

### Actual Outcome

1. Spec and planning artifacts were generated successfully.
2. Harness runs reached `complete` under configurations that did not require source mutation.
3. Source paths (`src`, `test`, `bin`, `package.json`, `tsconfig.json`) showed no implementation deltas from this workflow thread.
4. `implement` step completion reflected gate confirmation and command checks, not verified source edits.
5. No meaningful transition to `create-pr` readiness occurred because implementation evidence in source files was absent.

### Gap Statement

The process currently demonstrates **workflow execution success** rather than **feature implementation success**. Until mutation-required validations and delivery criteria are enforced, `implement` can pass and `create-pr` can be considered procedurally reachable without actual code delivery.

### Acceptance Criteria Needed Before `create-pr`

1. At least one changed file under `src/**` or `test/**` tied to tasks.
2. Updated tests covering changed behavior where applicable.
3. `npm test` and `npm run build` pass after those source changes.
4. Diff-based evidence captured in run artifacts showing real implementation deltas.