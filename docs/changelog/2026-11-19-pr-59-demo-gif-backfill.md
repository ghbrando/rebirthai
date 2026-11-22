---
pr: 59
issues: []
date: 2026-11-19
branch: docs/backfill-demo-gifs
merge_commit: 95ce2f7
author: lead-chief-of-staff (record backfilled at release v0.2.0)
ids: []
areas: [docs/changelog/assets/backfill]
type: docs
status: merged
---

# Demo GIFs for earlier visible changes (#39–#52)

## Summary
Adds demo GIFs for the visible changes that merged before the demo-GIF rule (#57), so every
feature in this release can be seen without running the app. Image files only; no code changes.

## Context
PRs #39–#46 and #48–#52 changed screens but merged without GIFs.

## What changed
- `docs/changelog/assets/backfill/pr-<n>.gif` for #39, #40, #41, #42, #43, #44, #45, #46, #48,
  #49, #50, #51, #52. Recorded on `dev` against the local test environment with fictional data,
  phone width 390x844.

## Decisions and alternatives
- Kept in one `backfill/` folder rather than each record's asset folder, to keep the PR to images.
- #40 recorded with a throwaway fictional account. #41's operator phone alert is not shown (needs a
  hosted webhook). #42 shown as test output (guard applies only to production builds).

## Assumptions and open questions
None.

## Interfaces, data and configuration
None.

## Verification
Each GIF was reviewed before merge. Links in PR #59 are commit-pinned to 8a568bd.

## Known limitations and follow-ups
None.

## Risks and rollback
None (images only).

## Notes for future agents
Reuse these commit-pinned links in release briefs instead of re-recording.

## Related
[#57](2026-11-19-pr-57-demo-gif-check.md).
