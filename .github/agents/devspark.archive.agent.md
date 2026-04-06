---
description: Archive outdated documentation to .archive/, update Guide.md and CHANGELOG.md so .documentation stays current and clean
handoffs:
  - label: Run a site audit after archiving
    agent: devspark.site-audit
    prompt: Run a site audit to confirm the project is in good health after archiving
  - label: Evolve the constitution
    agent: devspark.evolve-constitution
    prompt: Review the constitution in light of the cleaned-up documentation
---

## Prompt Resolution

Determine the current git user by running `git config user.name`.
Normalize to a folder-safe slug: lowercase, replace spaces with hyphens, strip non-alphanumeric/hyphen chars.

Read and execute the instructions from the **first file that exists**:
1. `.documentation/{git-user}/commands/devspark.archive.md` (personalized override)
2. `.documentation/commands/devspark.archive.md` (team customization)
3. `.devspark/defaults/commands/devspark.archive.md` (stock default)

Where `{git-user}` is the normalized slug from step above.

## User Input

```text
$ARGUMENTS
```

Pass the user input above to the resolved prompt.
