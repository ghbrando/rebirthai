---
pr: 44
issues: [11, 27]
date: 2026-11-02
branch: feature/dashboard-takedown-notice
merge_commit: pending
author: implementation engineer
ids: []
areas: [app/(app)/dashboard/page.tsx, lib/dashboard/state.ts]
type: feature
status: merged
---

# Dashboard explains when a page was taken down

## Summary
An author whose page was taken down now sees why on the dashboard, in plain words, with "Keep editing" as the only action. "Publish again" is not offered.

## Context
Follow-up to PR #39 (dashboard) and PR #41 (report and takedown). This branch merges both; until they land, the diff includes their commits.

## What changed
- `lib/dashboard/state.ts`: new `taken_down` state (wins over published/unpublished when `takedown_at` is set) with copy "Your page is not visible right now" / "It was taken down after a report. Your story is safe and unchanged."
- `app/(app)/dashboard/page.tsx`: renders `TakedownNotice` from `takedownNotice(t)`; the permanent link is only computed for published pages.
- Tests in `lib/dashboard/state.test.ts`.

## Decisions and alternatives
- Taken down is its own state rather than a flag on top of "unpublished", so no publish action can leak through the copy.

## Assumptions and open questions
None.

## Interfaces, data and configuration
No schema changes.

## Verification
`npm run lint && npm run typecheck && npm test`.

## Known limitations and follow-ups
Merge after #39 and #41.

## Risks and rollback
Low; revert the PR.

## Notes for future agents
The publish route already blocks taken-down pages; this only fixes what the dashboard shows.

## Related
PRs #39 and #41.
