---
pr: 57
issues: []
date: 2026-11-19
branch: ci/demo-gif-check
merge_commit: df9f7f7
author: lead-chief-of-staff (record backfilled at release v0.2.0)
ids: []
areas: [.github/workflows/checks.yml]
type: infra
status: merged
---

# Visible changes need a demo GIF to merge

## Summary
Every PR into `dev` that changes screen files must now include a demo GIF in its description, or
carry the `no-visible-change` label. Before, this was a written rule only and some visible changes
merged without GIFs.

## Context
Owner rule: visible work is shown as GIFs/screenshots so it can be approved from the phone.
PRs #39–#52 merged without them (backfilled in #59).

## What changed
- `.github/workflows/checks.yml`: new step **Demo GIF for visible changes** inside the required
  `lint-typecheck-test` job, only when the PR base is `dev`. It diffs the merge commit against its
  base parent (`fetch-depth: 2`), and if any `app/` or `components/` `.tsx/.jsx/.css` file changed it
  requires `.gif` in the PR body or the `no-visible-change` label.
- The workflow now also runs on `edited`, `labeled`, `unlabeled`, so adding the GIF clears the check.

## Decisions and alternatives
- Inside the existing required job rather than a new required check: no ruleset change needed.
- Text match on `.gif` (not validating the image) keeps it simple; reviewers still look at it.

## Assumptions and open questions
None.

## Interfaces, data and configuration
New PR label convention: `no-visible-change`. No secrets used; PR body passed through `env`, not
interpolated into the script.

## Verification
The PR itself changed no screens and passed the step. Later PRs (#59, #60) passed it.

## Known limitations and follow-ups
Promotion PRs into staging/main are not checked (they carry the release walkthrough instead).

## Risks and rollback
A false failure would block a dev merge; add the label or remove the step to roll back.

## Notes for future agents
If screens move outside `app/` or `components/`, update the `UI` regex.

## Related
#59 (GIF backfill), pr-demo skill.
