---
pr: none (feature branch feat/publish-public merged directly; backfilled record)
issues: [7, 8]
date: 2026-10-24
branch: feat/publish-public
merge_commit: cbf7bee
author: hackathon subagent D (Publish & Public Page)
ids: [US-08, US-12, US-13, US-14, US-15, RC-03, RC-06, RC-11, RC-13, DD-02, DD-05, RISK-03]
areas: [app/(app)/preview, app/(app)/publish, app/api/publish, app/u/[handle], app/api/og, app/api/report, components/testimony]
type: feature
status: merged
---

# Preview, publish, unpublish, delete, and the public /@handle page

## Summary
Authors preview exactly what recipients will see, publish a snapshot as Public or Unlisted,
unpublish, or delete everything. Recipients open `/@handle` with no account and see the current
published story with a link preview, tap-to-play video, a Report link and, if allowed, Save contact.

## Context
SDD US-08, US-12–US-15 and the related constraints. Screens 7, 8, 13, 14.

## What changed
- `components/testimony/Renderer.tsx`: one renderer used by both preview and public page (US-08).
- `app/(app)/preview/page.tsx`: preview plus the reminder about naming other people (RISK-03).
- `app/api/publish/route.ts`: `POST {action: publish | unpublish | delete, visibility?}`. Publish
  copies draft → `published_content` and copies media to `media-public` (clearing stale public files
  first); unpublish removes public files; delete removes messages, media rows and all storage files.
- `app/u/[handle]/page.tsx`: server-rendered public page reading only anon-safe views; resolves old
  handles; separate "not available" vs "not found" states; `noindex` for Unlisted; OG metadata.
- `app/api/og/route.tsx`: link-preview image (name + title).
- `app/api/report/route.ts`: stores reports (form post or JSON).

## Decisions and alternatives
- **Snapshot publishing** (DD-05): edits never go live until republished.
- **Service-role client in publish** only after ownership is established through RLS; it acts on
  that testimony id alone (needed to move files between buckets).
- **Public page uses views only**; to tell "unpublished" from "never existed" it does an
  existence-only lookup with the service client.
- **Delete resets the testimony row instead of deleting it.** Story, conversation and media are
  removed, and the row returns to an empty draft. Because DD-08 allows one testimony per profile
  and the profile and handle stay, this keeps the handle and the profile intact.

## Assumptions and open questions
- **Open:** US-12 says the public URL shows **not found** after deletion. With the row reset to an
  empty draft, the page likely shows **not available** instead. Confirm with the owner whether that
  satisfies US-12 or the page should treat an emptied testimony as not found.

## Interfaces, data and configuration
Reads views `public_profiles`, `public_testimonies`, `handle_lookup`; writes `testimonies`,
`reports`; storage `media-private` → `media-public`.

## Verification
Built and type-checked. Not run against a live backend; 2.5 s load budget not measured (#17).

## Known limitations and follow-ups
Performance (#17), device checks (#16), the delete/not-found question above.

## Risks and rollback
A bug in publish could expose draft media; any change to bucket copying needs security review.

## Notes for future agents
- Preview and public page must keep sharing `Renderer.tsx`; do not fork them.
- Never read base tables from `app/u/**`; add fields to the views instead.
- Video must stay tap-to-play with visible controls (RC-11).

## Related
[foundation](2026-10-24-foundation.md) (views) · [editor & media](2026-10-24-editor-media.md) ·
[contact card](2026-10-24-contact-card-share.md) · ARCHITECTURE rules 4, 6, 7 · POLICY §8
