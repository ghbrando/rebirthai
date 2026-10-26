---
pr: 23
issues: []
date: 2026-10-26
branch: docs/change-records
merge_commit: pending
author: Lead agent
ids: []
areas: [docs/changelog, CHANGELOG.md]
type: docs
status: open
---

# Change records: one context record per change in docs/changelog/

## Summary
Added `docs/changelog/`, a folder with one file per change that holds everything a future agent
needs about it, and backfilled records for every change so far: the six MVP pieces, the integration
and demo-mode commits, and PRs #21 and #22.

## Context
Course recommendation (CSCI 5520): a changelog folder with a Markdown file per change that agents
can use as context later. The owner's guidance: more context is better than less. This replaces the
earlier `docs/feature_history/` idea, which never got any content in this repo.

## What changed
- `docs/changelog/README.md`: purpose, how agents should search it, naming, and an index (newest first).
- `docs/changelog/_TEMPLATE.md`: front matter (`pr`, `issues`, `date`, `branch`, `merge_commit`,
  `author`, `ids`, `areas`, `type`, `status`) and sections: Summary, Context, What changed,
  Decisions and alternatives, Assumptions and open questions, Interfaces/data/config, Verification,
  Known limitations, Risks and rollback, Notes for future agents, Related.
- Nine backfilled records built from the actual diffs and code comments, not only commit titles.
- `CHANGELOG.md`: release lines now link to their records.

## Decisions and alternatives
- **Records are written inside the PR** (open as draft → get the number → write the record → ready),
  so the record ships with the code and is reviewed with it. Alternative rejected: writing records
  after merge, which drifts and gets skipped.
- **Front matter lists `areas` and `ids`** so agents can find relevant records with `grep` instead of
  reading the whole folder.
- **Changes without a PR** (the MVP branches merged directly) are named without a PR number and say
  so in `pr:`.
- **`CHANGELOG.md` stays** as the short per-release summary; the records hold the detail.

## Assumptions and open questions
- Backfilled records infer some reasoning from code comments; where intent is inferred it says so or
  states the deviation (e.g. RC-09 resumable uploads deferred).
- Found while backfilling: deleting a testimony resets its row rather than deleting it, so the
  public page may show "not available" instead of US-12's "not found". Recorded in the publish
  record for an owner decision.

## Interfaces, data and configuration
None.

## Verification
Claims in the records were checked against the code (callback routing, vCard tests, 503 handling,
delete behavior, views). Docs only; no code changed.

## Known limitations and follow-ups
The delete/not-found question (see the publish record). `merge_commit` here is filled on the next
change through `dev`.

## Risks and rollback
Docs only.

## Notes for future agents
- Every PR adds its own record and an index line; `feature-cycle` and `release-candidate` enforce it.
- Before working in an area: `grep -l "<path or ID>" docs/changelog/*.md` and read those records.
- Reversing a decision recorded here is an escalation, not a refactor.

## Related
[README](README.md) · [Lab 3 planning](2026-10-26-pr-21-lab3-planning.md) · [CHANGELOG setup](2026-10-26-pr-22-changelog.md)
