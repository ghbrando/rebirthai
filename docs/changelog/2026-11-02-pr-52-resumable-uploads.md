---
pr: 52
issues: [13]
date: 2026-11-02
branch: feature/13-resumable-uploads
merge_commit: pending
author: Implementation engineer agent, from Issue #13 (tus-js-client approved by the owner)
ids: [RC-09, RISK-06, US-07, RC-07, RC-06, RC-11]
areas: [lib/media, app/api/upload-url, app/api/publish, components/editor/media-uploader.tsx, components/profile, app/(app)/settings, lib/types.ts, supabase/config.toml, supabase/migrations/0004_storage_limits.sql, docs/ARCHITECTURE.md, docs/POLICY.md, package.json]
type: security
status: open
---

# Resumable uploads for large videos

## Summary
Videos larger than 6 MB now upload in resumable 6 MB pieces straight from the browser to Supabase
Storage. If the connection drops, the upload pauses ("Paused, reconnecting…") and continues from the
last finished piece when the network returns; choosing the same file again after a reload also
continues instead of starting over. Authors can cancel an upload, and the progress bar is accessible.

## Context
Issue #13 (RC-09, RISK-06, US-07). Before, every upload was one XHR PUT to a signed upload URL; on a
weak phone connection a 100 MB video failed and restarted from zero (the MVP deferred TUS, noted in
`lib/media/client.ts`). Acceptance: TUS directly from the browser, interrupted uploads resume,
progress and size/type limits unchanged, files never pass through Vercel functions.

## What changed
- `lib/media/resumable.ts` (new): pure helpers `chooseUploadMethod` (TUS for `video` over
  `RESUMABLE_THRESHOLD_BYTES` = 6 MB), `tusEndpoint`, `buildTusMetadata` (bucketName, objectName,
  contentType, cacheControl), `tusFingerprint` (testimony + file name/type/size/lastModified),
  `mediaIdFromObjectName`, `pickResumeCandidate`, `isRetryableStatus`, `friendlyTusError`,
  `UploadCancelledError`; and `runResumableUpload(file, opts, deps)`, which looks for an earlier
  interrupted upload of the same file, asks the server to reuse its media row, then runs a tus
  `Upload` (6 MB chunks, `retryDelays`, `uploadDataDuringCreation`, `removeFingerprintOnSuccess`).
  All browser/network pieces are injected (`ResumableDeps`) so the logic is unit-tested.
- `lib/media/client.ts`: `uploadMedia(testimonyId, file, { onProgress, onStatus, signal })`. Large
  videos go through `runResumableUpload` (tus-js-client is loaded with a dynamic import); everything
  else keeps the signed-URL XHR, which now also supports cancel.
- `app/api/upload-url/route.ts`: still the only place that validates type/size, checks testimony
  ownership and creates the `media` row. New optional body fields: `method: "resumable"` (skip
  creating a signed token) and `resumeMediaId` (return the existing row's path if it belongs to this
  testimony, the caller's folder, and has the same kind, mime and bytes; else 404 "Nothing to resume").
- `components/editor/media-uploader.tsx`: `role="progressbar"` with `aria-valuenow`/`aria-valuetext`,
  percent text in a polite live region, "Paused, reconnecting… (N% uploaded)" state, "Cancel upload"
  button; cancelling shows no error.
- `lib/types.ts`: `UploadUrlRequest.method?`, `UploadUrlRequest.resumeMediaId?`,
  `UploadUrlResponse.token` is now `string | null`.
- `supabase/config.toml`: local storage `file_size_limit` 50MiB -> 100MiB so local TUS uploads can
  reach the existing 100 MB video limit.
- `docs/ARCHITECTURE.md`: diagram, media flow and rule 11 describe both upload paths.

### Security review follow-ups (same PR)
- **Storage policy change, needs owner approval:** `supabase/migrations/0004_storage_limits.sql` sets
  `allowed_mime_types` (jpeg, png, webp, mp4, quicktime) and `file_size_limit` 100 MB on both
  `media-private` and `media-public`, and replaces the `for all` policy `media_public_avatars` with
  insert/update/delete policies limited to `avatars/<uid>/<file>.{jpg,jpeg,png,webp}` (no SELECT;
  photos are served by public URL). `media_private_owner` is unchanged.
- `app/api/publish/route.ts`: before removing old public files or copying anything, every media item
  is checked as actually stored (`storage.info()` size and content type, service role) with
  `checkStoredMedia` in `lib/media/validate.ts`: wrong or disallowed type, over the limit, or missing
  file -> 400 with a plain message; a photo with empty alt text -> 400 "Add a description to every
  photo before publishing." A refused publish leaves the live page untouched.
- `lib/media/resumable.ts`: the tus fingerprint is now `rebirthai-tus-<testimonyId>-<hash>` where the hash
  (`stableHash`, cyrb53) covers name + size + lastModified; the raw file name is never stored.
  `clearTusStorage()` removes `tus::*` localStorage entries; called by the new
  `components/profile/sign-out-button.tsx` (Settings) and after a successful account deletion.
- Account deletion (`lib/account`) reviewed, no change needed: it already removes
  `media-private/<uid>/**`, `media-public/avatars/<uid>/**` and `media-public/<testimony_id>/**`
  recursively (folders descended) and paginates listing and removal in pages of 1000.
- `docs/POLICY.md` §7 now says video location metadata is not stripped. Follow-ups: #53 (strip video
  location metadata), #54 (per-user storage cap and orphan cleanup).

## Decisions and alternatives
- **Auth: the user's session access token, not a signed upload token.** The storage policy
  `media_private_owner` already lets an authenticated user write only under `{their user id}/`, so TUS
  with the session JWT is covered by RLS with no policy change. The token is fetched per request
  (`onBeforeRequest` -> `supabase.auth.getSession()`), because a slow 100 MB upload can outlast one
  access token. The anon key is sent as `apikey` for the gateway. Service role never on the client.
- **TUS only for videos over 6 MB.** Images (max 10 MB, EXIF-stripped in the browser) and small
  videos fit in one or two chunks; the signed-URL path is simpler and already proven. The Issue's
  "uploads use TUS" is read as "the uploads that need resuming", per the Lead's plan.
- **Resume across reloads reuses the same media row.** The object path contains the media id, so a
  resumed upload must finish at the path its row points to. The client derives the media id from the
  stored upload's `objectName` and the server confirms it (`resumeMediaId`) before resuming. If the
  server refuses, the stale tus entries are forgotten and a fresh row and upload start. Alternative
  (always a new row, resume only within one page session) was rejected: it would not survive a reload.
- **Offline = indefinite pause, online errors = bounded retries.** tus-js-client does not retry when
  `navigator.onLine` is false; we then wait for the `online` event and restart the same `Upload`,
  which continues from the server's offset. While online, retries follow `TUS_RETRY_DELAYS`
  (0-20 s) for status 0/5xx/409/423/429, then show a plain message; choosing the file again resumes.
- **Cancel terminates** the TUS upload (`abort(true)`) so it is not resumed later.
- **Avatar policy without SELECT.** Postgres applies SELECT policies to UPDATE/DELETE that read rows,
  so authors can no longer remove or upsert avatars through the storage API. The app never does
  (uploads are plain inserts with a new timestamped name; deletion uses the service role).
- **Publish checks the stored object, not the row.** The row records what the browser claimed; storage
  metadata is what was actually written. Checks run before `removePublicFiles()` so a failure does not
  take the current page down.
- **lockfile:** npm on Windows pruned four optional `@emnapi/*` wasm entries; they were restored so
  the lockfile diff is purely additive and `npm ci` on Linux CI is unaffected.

## Assumptions and open questions
- Assumes Supabase accepts the session JWT plus `apikey` on `/storage/v1/upload/resumable` (per its
  docs) and that the hosted project's global upload size limit allows 100 MB. The Free plan caps
  uploads at 50 MB; if the hosted project is on Free, videos between 50 and 100 MB fail regardless
  of this change (owner setting, pre-existing, verify with I-17).
- `0004_storage_limits.sql`: on a hosted Free plan the bucket limit cannot effectively exceed the
  project-wide 50 MB cap. `storage.info()` needs a storage version with the object info endpoint
  (hosted has it; local CLI image unverified).
- Video length (about 3 minutes, POLICY) is still not enforced in code; only the 100 MB size limit is.
  Unchanged by this PR.

## Interfaces, data and configuration
- New dependency: `tus-js-client` 4.3.1 (exact pin; owner-approved).
- API: `POST /api/upload-url` accepts optional `method` (`"signed"` default | `"resumable"`) and
  `resumeMediaId` (uuid, resumable only). Response `token` is `null` for resumable.
- Local config: `supabase/config.toml` `[storage] file_size_limit = "100MiB"`.
- Migration `0004_storage_limits.sql` (bucket type/size limits, narrowed avatar policies). Storage policy
  change: needs owner approval before applying to a hosted project. No table changes. No new env vars.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test`: all pass.
- New `lib/media/validate.test.ts` (publish-time stored-media check) and fingerprint/cleanup tests.
- New `lib/media/resumable.test.ts` (17 tests): threshold choice, chunk size, endpoint and metadata
  building, fingerprint, retryable statuses, resume-candidate selection, orchestrator with a fake tus
  `Upload` (new upload with user token, resume into the same media row, server-refused resume starts
  fresh, offline pause then continue on the same instance, no retry offline, plain error, cancel).
- Not done here: applying 0004 to a local database, a run against real or local Supabase Storage, the manual throttle-and-interrupt test,
  and screenshots/GIF of the progress and paused states (no browser was run for this change).

## Known limitations and follow-ups
- A cancelled or abandoned upload leaves its `media` row without a file (same as failed uploads before).
- Server does not cross-check the uploaded object's real size against the reserved `bytes` (same as
  the signed-URL path before); storage RLS limits writes to the caller's own folder.
- Manual device test against real storage depends on I-17.

## Risks and rollback
- If TUS fails in an environment (gateway, CORS, size cap), only videos over 6 MB are affected; the
  user sees a plain error. Rollback: revert this PR, or make `chooseUploadMethod` return `"signed"`.

## Notes for future agents
- Keep `TUS_CHUNK_SIZE` at exactly 6 MB; Supabase requires it.
- The object path format `{user_id}/{testimony_id}/{media_id}.{ext}` is parsed by
  `mediaIdFromObjectName`; if `/api/upload-url` changes the path format, update both.
- `lib/media/resumable.ts` imports only types from tus-js-client; keep it that way so tests run in Node.

## Related
- `docs/changelog/2026-10-24-editor-media.md` (original upload flow)
- SDD 5.2 media flow; ARCHITECTURE rule 11; POLICY media limits
