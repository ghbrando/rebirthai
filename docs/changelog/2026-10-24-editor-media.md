---
pr: none (feature branch feat/editor-media merged directly; backfilled record)
issues: [5, 6, 13]
date: 2026-10-24
branch: feat/editor-media
merge_commit: 52c0c3d
author: hackathon subagent C (Editor & Media)
ids: [US-06, US-07, RC-06, RC-09, RC-11]
areas: [app/(app)/editor, app/api/upload-url, components/editor, lib/media]
type: feature
status: merged
---

# Editor with autosave, accept/reject AI suggestions, and private photo/video uploads

## Summary
Authors edit their draft directly (saved automatically), review the coach's suggestions one by one,
and place photos and short videos in the story with captions and required alt text. Location data
is removed from photos before upload, and draft media stays private.

## Context
SDD US-06, US-07, RC-06, RC-09, RC-11. Screen 6.

## What changed
- `components/editor/testimony-editor.tsx`: TipTap editor bound to `draft_content` with autosave.
- `components/editor/suggestions-panel.tsx`: shows suggestions; accepting replaces the exact text
  range (located by `original`, preferring the suggested block).
- `components/editor/media-nodes.tsx`, `media-uploader.tsx`: image/video blocks with caption and
  alt text; progress indicator.
- `lib/media/validate.ts`: type and size rules shared by client (friendly errors) and server
  (enforcement). Images JPG/PNG/WebP ≤10 MB; video MP4/MOV ≤100 MB.
- `lib/media/strip-exif.ts`: re-encodes images through a canvas, dropping all metadata including GPS;
  orientation is baked in first; throws rather than upload an unstripped image.
- `lib/media/client.ts`: validate → strip → request signed URL → upload with progress; short-lived
  signed read URLs while in draft.
- `app/api/upload-url/route.ts` (+ `meta`, `sign`): checks the testimony belongs to the caller,
  issues signed upload URLs to `media-private`, records media metadata, signs read URLs.

## Decisions and alternatives
- **Canvas re-encode for EXIF removal** instead of an EXIF-parsing library: removes everything, no
  dependency. Trade-off: images are re-compressed.
- **Upload is a single XHR PUT with progress**, not true resumable (TUS) upload. This **deviates
  from RC-09** and was deferred for time (#13).
- **Same validation module on client and server** so messages and enforcement cannot drift.

## Assumptions and open questions
- Video length (about 3 minutes) is not checked, only size (OQ-07).

## Interfaces, data and configuration
Writes `media` rows; storage paths `media-private/<user id>/<testimony id>/...`.

## Verification
Built and type-checked. Display on iOS Safari / Android Chrome not tested (#16).

## Known limitations and follow-ups
Resumable uploads (#13). Video duration not enforced.

## Risks and rollback
If `strip-exif` is bypassed, author location could leak publicly: never add an upload path that
skips it.

## Notes for future agents
- Large files must never pass through a Vercel function (RC-09); keep uploads browser → Storage.
- Alt text is required for images (RC-11); do not make it optional in the node schema.
- Suggestion accept depends on exact excerpts; if you change how suggestions are generated, keep
  `original` an exact substring.

## Related
[AI coach](2026-10-24-ai-coach.md) (suggest endpoint) · [publish](2026-10-24-publish-public-page.md)
(moves media to public) · POLICY §7
