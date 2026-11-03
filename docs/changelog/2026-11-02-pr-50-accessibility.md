---
pr: 50
issues: [15]
date: 2026-11-02
branch: feature/15-accessibility
merge_commit: pending
author: Implementation Engineer
ids: [RC-11]
areas: [app/globals.css, app/layout.tsx, "app/(app)/layout.tsx", components/coach, components/editor, components/profile, components/share, components/ui/button.tsx]
type: fix
status: open
---

# Accessibility pass (WCAG 2.1 AA code audit)

## Summary
Every screen was audited in code against WCAG 2.1 AA and fixed: visible focus, text and field-border contrast, labels, announced errors and coach messages, landmarks, a skip link and page titles. Visual change is small.

## Context
Issue #15 (RC-11). Nothing had checked accessibility. Running axe needs a signed-in app (I-17), so this pass is a code audit; the axe report and manual keyboard/screen-reader walk-through remain.

## What changed
- `app/globals.css`: global `:focus-visible` outline (2px #1d4ed8), placeholder colour #6b7280.
- `components/ui/button.tsx`: removed `outline-none` and the faint ring; destructive text red-800.
- `app/layout.tsx` plus `export const metadata` on each screen: title template `%s | RebirthAI`.
- `app/(app)/layout.tsx`: skip link; all `<main>` elements carry `id="main-content"`.
- `components/coach/CoachChat.tsx`: now a `<main>` with hidden `<h1>`; conversation is `role="log"` (polite, `aria-busy` while streaming); labelled textarea; story-progress chips are a list with text states.
- `components/editor/*`: toolbar `role="toolbar"`, editor `aria-label`, alt-text errors linked and announced, uploader inputs labelled, suggestion buttons numbered and result status announced.
- `components/profile/*`, `components/share/contact-fields-form.tsx`, `PublishPanel.tsx`, `app/u/[handle]/page.tsx`: `aria-invalid`/`aria-describedby`, alert roles, h1 fallback.
- Contrast: gray-400/500 text to gray-600, red-600 to red-700, text-input borders to gray-500.

## Decisions and alternatives
- aria-busy on the chat log instead of aria-live on each token: streaming would otherwise be read word by word.
- Global focus rule over per-component classes: one place, cannot be forgotten on new controls.
- Input borders darkened (1.4.11) rather than left as the light shadcn default; this is the one visible change.
- Toolbar uses Tab (all four buttons are real buttons) rather than arrow-key roving; simpler and still keyboard-usable.

## Assumptions and open questions
Contrast was computed from the Tailwind palette, not measured in a browser. Nav `aria-current` skipped.

## Interfaces, data and configuration
None. No dependencies.

## Verification
`npm run lint`, `npm run typecheck`, `npm test` all pass (76 tests). No automated axe run yet.

## Known limitations and follow-ups
axe report at `docs/verification/accessibility.md`, screen-reader pass, keyboard walk-through (see PR body).

## Risks and rollback
Low. Class and attribute changes only; revert the PR. The `<main>` change in CoachChat alters its root element.

## Notes for future agents
New text inputs should use `border-gray-500`; avoid `outline-none`; new screens need a `metadata` title and `<main id="main-content">`.

## Related
RC-11; skills/rules in `docs/POLICY.md`.
