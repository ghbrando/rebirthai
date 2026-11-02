---
pr: pending
issues: [35]
date: 2026-11-02
branch: feature/35-copy-pass
merge_commit: pending
author: Implementation Engineer
ids: [RC-03, RC-11]
areas: [app/(app)/publish, app/(app)/share, app/(app)/contact, app/(app)/preview, app/(app)/layout.tsx, components/editor, components/profile, components/share]
type: feature
status: open
---

# Beta copy pass: plain words and one link format

## Summary
Removed design-document labels and system words from author screens, and the author's link now always appears as the full `${site}/@handle` address.

## Context
Issue #35 (UX review of PR #34). Copy only; no behavior, schema or visibility changes.

## What changed
- "Screen N" labels removed from publish, preview, share, contact.
- Publish page: one sentence per state (published, unpublished, never published) via `statusSentence`; PublishPanel and profile form use `permanentUrl` from `lib/vcard/build.ts`.
- Editor: toolbar Heading/Subheading; headings styled inside editor; Preview is a button-style link.
- Suggestions panel titled "Ask the AI for help".
- "Download .vcf" becomes "Download contact card"; contact guide uses plain words; nav item "Contact" becomes "Contact card".

## Decisions and alternatives
Reused existing `permanentUrl` rather than adding a new helper. Public/Unlisted wording, default and delete button are left to Issue #36.

## Assumptions and open questions
Issue awaiting owner review. Phone-width screenshots were not captured (no dev server allowed in this run).

## Interfaces, data and configuration
None. `PublishPanel` prop `handle` replaced by `url`.

## Verification
`npm run lint && npm run typecheck && npm test` pass. No tests asserted the old strings.

## Known limitations and follow-ups
Screenshots and domain-language-review pending. The internal `/u/handle` redirect in the report route is untouched.

## Risks and rollback
Copy only; revert the PR.

## Notes for future agents
Editor heading look uses arbitrary Tailwind variants on the editor class.

## Related
Issue #36, docs/POLICY.md section 3.
