---
pr: TBD
issues: [38]
date: 2026-11-02
branch: feature/38-polish
merge_commit: pending
author: Implementation Engineer
ids: [RC-11]
areas: [app/layout.tsx, app/globals.css, app/(app)/layout.tsx, app/(app)/settings, app/page.tsx, components/coach/CoachChat.tsx]
type: feature
status: open
---

# First-impression polish: readable type, phone-width menu, calmer coach header

## Summary
Every screen now uses Inter instead of the browser default serif, the app menu fits a 360px phone, the coach header is shorter with the progress chips explained once, the landing page states what RebirthAI is without a big gap, and Settings shares the app menu.

## Context
Issue #38 (RC-11). Before: default serif, menu overflowed (Share cut off), tall coach header, centered landing with empty space, Settings had no menu.

## What changed
- `app/layout.tsx`, `app/globals.css`: Inter via `next/font/google` (`--font-inter`), wired to `--font-sans` and body. Geist sans removed; Geist Mono kept.
- `app/(app)/layout.tsx`: nav is a 4-column, two-row grid on phones and a single row from `sm`; labels unchanged; links are real links so keyboard works.
- `app/(app)/settings/page.tsx`: moved from `app/settings` (URL unchanged) so it gets the app layout.
- `components/coach/CoachChat.tsx`: tighter header, one legend line, 988 line kept, chip text darkened for contrast; chat height accounts for the two-row nav.
- `app/page.tsx`: top-aligned, one-line description.

## Decisions and alternatives
- Menu: grid over a hamburger, since it needs no JS or dependency and keeps every link visible. Chat height uses fixed rem (5.25rem phone nav), so changing nav row height means updating CoachChat.
- Settings: moved into the `(app)` route group rather than duplicating the nav.
- Public testimony keeps the sans body; no serif, to stay small.

## Assumptions and open questions
Screenshots at 360px pending a running-app check by the Lead.

## Interfaces, data and configuration
None. No new dependencies.

## Verification
`npm run lint && npm run typecheck && npm test`. Visual check pending.

## Known limitations and follow-ups
Public page performance budget (#17) not measured here; one extra font family replaces another.

## Risks and rollback
Revert the commit. Nav height assumption could misalign the coach chat if styles change.

## Notes for future agents
Nav row height (py-2.5 + text-sm = 2.5rem per row) is mirrored in CoachChat's calc.

## Related
Issue #38; PRs #43 and #36 touch nearby copy.
