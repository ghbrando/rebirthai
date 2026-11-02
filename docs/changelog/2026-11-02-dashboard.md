---
pr: 39
issues: [11]
date: 2026-11-02
branch: feature/11-dashboard
merge_commit: pending
author: implementation engineer agent
ids: [RC-01, RC-03]
areas: [app/(app)/dashboard, lib/dashboard]
type: feature
status: open
---

# Dashboard: where your testimony stands and what to do next

## Summary
Signed-in authors now land on a real dashboard that says in plain words where their testimony stands
(not started, in progress, published, or not public) and offers one clear next step.

## Context
Issue #11. The dashboard was a `PageStub` placeholder.

## What changed
- `lib/dashboard/state.ts`: pure `deriveDashboardState` and `dashboardCopy` (wording and actions per state).
- `lib/dashboard/state.test.ts`: Vitest cases for every state and a wording guard.
- `app/(app)/dashboard/page.tsx`: server page using `requireProfile`, reads the testimony and a count of
  coach messages, renders the heading, explanation, permanent link (when published) and buttons.

## Decisions and alternatives
- "In progress" = never published and has coach messages, draft text or a title. Otherwise "not started".
- Published splits into findable by anyone vs. only people with the link (from the visibility column).
- Primary action: not started -> coach; in progress -> editor (coach if no draft text yet); published ->
  view my page; not public -> keep editing, with "Publish again" as secondary.
- The permanent link reuses `permanentUrl` from `lib/vcard/build.ts`; always the `/@handle` form.

## Assumptions and open questions
- The Issue lists no "publish" primary; "Publish" and "Publish again" are secondary buttons.

## Interfaces, data and configuration
None (read-only queries on existing tables).

## Verification
`npm run lint`, `npm run typecheck`, `npm test` pass (23 tests). Running-app check left to the Lead.

## Known limitations and follow-ups
No visual evidence yet.

## Risks and rollback
Read-only page; revert the PR to restore the stub.

## Notes for future agents
If a new testimony status or visibility is added, update `deriveDashboardState` and its tests.

## Related
Issue #11; `docs/changelog/2026-10-24-publish-public-page.md`.
