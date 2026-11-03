---
pr: 48
issues: [28]
date: 2026-11-02
branch: feature/28-feedback-link
merge_commit: pending
author: implementation engineer
ids: []
areas: [app/(app)/layout.tsx, lib/feedback.ts, README.md]
type: feature
status: merged
---

# Send feedback link for beta users

## Summary
Every signed-in screen now ends with a small, grey "Send feedback" link that opens the owner's feedback form or email. If no address is configured, nothing is shown.

## Context
Issue #28 (beta plan): users need a one-tap way to say what works and what they want next.

## What changed
- `lib/feedback.ts`: `getFeedbackUrl(raw)` returns the trimmed `NEXT_PUBLIC_FEEDBACK_URL` or null when unset, blank, unparseable, or not `http(s):` / `mailto:`.
- `app/(app)/layout.tsx`: footer with the link below the page content, pushed to the bottom (`mt-auto`). Web links open in a new tab; `mailto:` opens in place.
- `lib/feedback.test.ts`: unset/blank, form and mailto, and rejected schemes.
- README env table row.

## Decisions and alternatives
- Footer link instead of an item in the top menu: the menu already overflows on a phone (#45), and the request was "unobtrusive".
- A plain external link instead of an in-app form: no new storage, no new paid service (Issue constraint), and the owner can pick Google Forms or email.
- Scheme allow-list so a mistyped or hostile env value cannot render a `javascript:` link.

## Assumptions and open questions
- Not done: "feedback arrives with the page it was sent from, and the handle only with consent". A static link cannot carry either. Owner decision needed: either put a hint in the form itself (a "which page?" question and an optional handle field with a consent note), or build an in-app form (new table or webhook, more scope). The link works with the first at no extra cost.
- Issue wording says "in the signed-in menu"; this is a footer on the same screens.

## Interfaces, data and configuration
New optional env `NEXT_PUBLIC_FEEDBACK_URL` (build-time, public by nature). No schema changes.

## Verification
`npm run lint && npm run typecheck && npm test`: clean, 79 tests pass (3 new). Not viewed in a browser (app not run by this author).

## Known limitations and follow-ups
Only signed-in screens; the public `/@handle` page and landing page have no link. Needs a rebuild/restart to pick up a changed env value.

## Risks and rollback
Low. Revert the layout hunk to remove the link.

## Notes for future agents
`NEXT_PUBLIC_*` values are inlined at build time, so set it before `next build`.

## Related
`docs/BETA_PLAN.md`, `2026-11-02-pr-45-first-impression-polish.md`.
