---
pr: none (feature branch feat/contact-share merged directly; backfilled record)
issues: [9]
date: 2026-10-24
branch: feat/contact-share
merge_commit: 794f360
author: hackathon subagent E (Contact Card & Share)
ids: [US-09, US-10, US-11, RC-03, RC-10, RC-12, DD-03]
areas: [lib/vcard, app/api/vcard/[handle], app/(app)/contact, app/(app)/share, components/share, vitest.config.ts]
type: feature
status: merged
---

# Contact card (.vcf) and QR code that carry the testimony link, plus sharing

## Summary
Right after publishing, authors get a contact card containing their testimony link, a QR code that
saves it on someone else's phone in one scan, and step-by-step guides to add the link to their own
contact card on iPhone and Android. They can also copy the link or use the phone's share sheet.

## Context
SDD US-09–US-11, RC-10 (vCard compatibility), RC-12 (opt-in contact fields), DD-03. Screens 9, 10, 12.

## What changed
- `lib/vcard/build.ts`: vCard 3.0 (RFC 2426) builder. Fields FN, N, TEL, EMAIL, URL, NOTE; UTF-8;
  escapes backslash, comma, semicolon and newline; folds lines at 75 octets without splitting a
  UTF-8 character; splits a full name into family and given names; never includes a photo.
- `lib/vcard/build.test.ts`: 7 unit tests: escaping; CRLF structure; permanent URL and note; N/FN
  for one- and multi-word names; phone/email omitted unless opted in; 75-octet folding on UTF-8
  boundaries; long-name round trip.
- `app/api/vcard/[handle]/route.ts`: serves `text/vcard` as `.vcf`. Anonymous requests use a view
  that exposes contact fields only when `share_contact` is on; the author can fetch their own card
  before publishing; old handles redirect (RC-03).
- `app/(app)/contact/*`, `components/share/contact-fields-form.tsx`: choose which fields go on the
  card (name always included), with the iPhone/Android guide.
- `app/(app)/share/page.tsx`, `components/share/share-actions.tsx`: QR code, copy link, Web Share API.

## Decisions and alternatives
- **QR encodes the full vCard text**, not a bare link: one scan saves the person and the link, and it
  works offline (RC-10, SDD §6.3).
- **No photo in the card** to keep the QR small and fast to scan.
- **Permanent URL is handle-based** (`/@handle`), built in one helper so every card uses the same form.

## Assumptions and open questions
- The domain inside every card is `NEXT_PUBLIC_SITE_URL`. Cards are permanent once shared, so
  **no real cards before the domain is final** (D-04, #19).
- Whether NameDrop/AirDrop/Android sharing keep the URL field is untested (OQ-05, #16).

## Interfaces, data and configuration
`GET /api/vcard/<handle>` → `text/vcard`. Uses `NEXT_PUBLIC_SITE_URL`.

## Verification
`npm test` runs `lib/vcard/build.test.ts` (passing at merge). Device import and QR scanning not tested (#16).

## Known limitations and follow-ups
Device matrix (#16); domain decision (#19).

## Risks and rollback
A wrong domain or URL format baked into shared cards cannot be fixed remotely.

## Notes for future agents
- Any change to `build.ts` must keep the tests passing and stay vCard 3.0; iPhone and Android
  import 3.0 most reliably.
- Never add contact fields to the public view without the `share_contact` check (RC-12).

## Related
[auth & profile](2026-10-24-auth-profile.md) (opted-in fields, redirects) ·
[publish](2026-10-24-publish-public-page.md) · POLICY §7, §11
