---
pr: 46
issues: [36]
date: 2026-11-02
branch: feature/36-publish-clarity
merge_commit: pending
author: Implementation Engineer
ids: [US-12, US-13, US-09, RC-06]
areas: [app/(app)/publish, components/profile/profile-form.tsx, components/share/contact-fields-form.tsx, lib/visibility.ts]
type: feature
status: merged
---

# Publish screen: clear "who can see this", safe delete, plain contact consent

## Summary
Public and Unlisted are each explained in one plain sentence, the default is Unlisted, Delete sits apart from Publish/Unpublish with a clear confirmation, and the contact-details consent sentence is identical in settings and on the contact page.

## Context
Issue #36 (I-27). Before: both options said "anyone with the link", used the word "index", defaulted to Public, "Delete permanently" sat beside Republish, and the contact note was small grey text worded differently in each place.

## What changed
- `lib/visibility.ts`: `DEFAULT_VISIBILITY` (one-line flip for D-09), `VISIBILITY_TEXT`, `CONTACT_CONSENT_TEXT`.
- `app/(app)/publish/page.tsx`: default applies to drafts; saved value kept once published/unpublished.
- `PublishPanel.tsx`: new wording; Delete moved below a divider, labelled "Delete my testimony", confirm text says what is lost and that the link and QR code stop working.
- `profile-form.tsx`, `contact-fields-form.tsx`: shared consent sentence, normal-size text under the checkbox(es).

## Decisions and alternatives
UI default only; no migration (DB default `'public'` in 0001 left alone). The publish API always receives `visibility` from the panel, so the DB default is not hit by the UI.

## Assumptions and open questions
Owner decision D-09: Unlisted implemented; flip `DEFAULT_VISIBILITY` for Public.

## Interfaces, data and configuration
None.

## Verification
`npm run lint && npm run typecheck && npm test` pass. Phone-width screenshots not taken (no dev server allowed in this run).

## Known limitations and follow-ups
`/api/publish` falls back to `public` if `visibility` is missing, and the delete action resets the stored value to `public` (the page default covers drafts). Screenshots and UX review still needed.

## Risks and rollback
Low; revert the PR.

## Notes for future agents
Keep the consent sentence in `lib/visibility.ts` only. PR #43 also edits some publish/settings strings.

## Related
Issue #36.
