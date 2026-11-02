---
pr: 49
issues: [25]
date: 2026-11-02
branch: feature/25-privacy-terms
merge_commit: pending
author: Implementation agent, from Issue #25 (draft for owner and legal review)
ids: [RC-06, RC-12, RC-13, RC-03, RC-05]
areas: [app/privacy, app/terms, components/legal, lib/legal.ts, app/page.tsx, app/(auth)/sign-in, app/u/[handle]]
type: feature
status: open
---

# Privacy policy and terms of use (draft)

## Summary
Two public pages, `/privacy` and `/terms`, explain in plain words what RebirthAI collects, who can
see it, who processes it, how long it is kept and how to delete it, and the rules for using the
beta. Both are linked from the landing page footer, the sign-in page and the public testimony page
footer. Owner-only facts are placeholders, and a "Draft — not reviewed by a lawyer" banner shows
until they are filled in.

## Context
Issue #25 is on the private-beta bar (`docs/BETA_PLAN.md`): beta users share deeply personal
stories, and there was no privacy policy or terms. Acceptance: the policy covers what is collected
and why, processors, retention and deletion; the terms cover acceptable content and the operator's
right to remove pages; both linked from sign-in and the public page footer; owner reviews the text.

## What changed
- `lib/legal.ts` (new): `LEGAL_DRAFT` (banner switch), `LEGAL` (placeholders: operator name, contact
  email, effective date, governing law, Anthropic data use, hosting log retention),
  `DRAFT_BANNER_TEXT`, `isPlaceholder`, `unfilledPlaceholders`.
- `lib/legal.test.ts` (new): placeholder detection, and a guard that the banner stays on while any
  placeholder is unfilled.
- `components/legal/LegalPage.tsx` (new): shared layout (same width and spacing as `/u/[handle]`),
  draft banner (`role="note"`), effective date, `Section`, `List`, `ContactLine`.
- `components/legal/LegalLinks.tsx` (new): "Privacy policy" / "Terms of use" nav (`aria-label="Legal"`),
  touch-friendly padding.
- `app/privacy/page.tsx`, `app/terms/page.tsx` (new): static server pages, no session reads, so
  they work signed out.
- `app/page.tsx`: footer with the legal links. `app/(auth)/sign-in/page.tsx`: one sentence ("By
  signing in, you agree to our terms of use and privacy policy. RebirthAI is for adults 18 and
  older.") plus the links. `app/u/[handle]/page.tsx`: links under the Report control.

## Decisions and alternatives
- **Text in TSX, facts in one constant file.** Considered Markdown/MDX; rejected to avoid a new
  dependency. Every owner-only fact is in `lib/legal.ts` so filling them in is a one-file edit.
- **Banner by constant, not env var**, so it is visible in review and removal is a one-line,
  reviewed change. The test fails if someone turns the banner off while a placeholder remains.
- **Anthropic training statement is a placeholder.** No doc in the repo states Anthropic's API data
  retention or training terms, so the page does not claim either way.
- **Grounding sources:** POLICY §7, §9, §11; `docs/OPERATIONS.md` retention; `lib/ai/usage.ts` (cost
  lines: tokens, model, est. cost, testimony ID only); `app/api/coach/**` (what is sent to Anthropic:
  conversation; draft + conversation for suggestions); `app/api/report` (IP rate-limit in memory, not
  stored); `lib/report-notify.ts` (alert has link + time only); `lib/visibility.ts` (Unlisted default,
  D-09); `lib/media/strip-exif.ts` (images only); sign-in form (email link and Google).
- **Not linked from the in-app (signed-in) menu**: out of the requested scope; can be added later.

## Assumptions and open questions
Owner placeholders: [OPERATOR LEGAL NAME], [CONTACT EMAIL], [EFFECTIVE DATE], [GOVERNING LAW / STATE],
Anthropic data use, [LOG RETENTION PERIOD] (#19). Claims needing owner confirmation are listed in the
PR body (e.g. "we do not sell your information", Google sharing name and photo, Supabase sending
sign-in emails, the right to end someone's use, "we'll tell you in the app" for important changes,
the sign-in agreement sentence, 18+ with no age check in code). Not legal advice; formal legal
review is out of scope (#25).

## Interfaces, data and configuration
None. No schema, env var or dependency changes. New public routes `/privacy` and `/terms`.

## Verification
`npm run lint`, `npm run typecheck`, `npm test` (all pass; new `lib/legal.test.ts`). Screenshots on
mobile are pending (no browser run in this pass; per the Issue's verification step they are taken
during review).

## Known limitations and follow-ups
- No age check in the app; "18+" is a stated rule only.
- Owner text review is the remaining acceptance criterion (#25).

## Risks and rollback
Text-only pages and links; revert the PR to remove. Risk is a statement that drifts from the code:
if data handling changes, update `/privacy` in the same PR.

## Notes for future agents
- Every sentence in `/privacy` maps to code or docs listed above. If you change what is collected,
  logged, sent to Anthropic, kept after deletion, or who processes it, update the page too.
- To finalize: fill `LEGAL` in `lib/legal.ts`, then set `LEGAL_DRAFT = false`.

## Related
`docs/POLICY.md` §7, §9, §11; `docs/OPERATIONS.md`; `docs/BETA_PLAN.md`;
[delete account](2026-11-02-delete-account.md); [report takedown](2026-11-02-report-takedown.md).
