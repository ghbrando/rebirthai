---
pr: 42
issues: [37]
date: 2026-11-02
branch: feature/37-site-url-guard
merge_commit: pending
author: implementation engineer
ids: [RC-03]
areas: [lib/site-url.ts, lib/vcard/build.ts, app/u/[handle]/page.tsx]
type: fix
status: merged
---

# Contact cards never point at a test address

## Summary
In production, contact cards and QR codes can no longer be built with a localhost or *.vercel.app address. A missing or test-address site URL now fails loudly instead of quietly producing a permanent, wrong link.

## Context
Issue #37. `lib/vcard/build.ts` fell back to `http://localhost:3000`, and the public page had its own separate fallback (including `VERCEL_URL`). Cards are permanent once shared.

## What changed
- New `lib/site-url.ts` with `getSiteUrl(env)`, the single source for the public origin.
- `lib/vcard/build.ts` and `app/u/[handle]/page.tsx` (metadataBase) use it. These were the only users of `NEXT_PUBLIC_SITE_URL`/`VERCEL_URL`.
- Tests in `lib/site-url.test.ts` for every env combination.

## Decisions and alternatives
- Production = `NODE_ENV=production` with `VERCEL_ENV=production` or unset (self-hosted/CI production build). Throws if the URL is missing, localhost, 127.0.0.1 or *.vercel.app. No `VERCEL_URL` fallback in production.
- Preview (`VERCEL_ENV=preview`): uses `NEXT_PUBLIC_SITE_URL` if set and not local, else `https://VERCEL_URL`. The public page already behaved this way; now the vCard does too.
- Local dev/test keeps the localhost default.

## Assumptions and open questions
- A production `next build` that renders these paths without the variable set will now fail; intended, but deploy settings must set `NEXT_PUBLIC_SITE_URL` (domain pending, D-04).

## Interfaces, data and configuration
No schema changes. `NEXT_PUBLIC_SITE_URL` is now required in production.

## Verification
`npm run lint && npm run typecheck && npm test`; new tests in `lib/site-url.test.ts`.

## Known limitations and follow-ups
Issue awaits owner review.

## Risks and rollback
Production misconfiguration now shows as an error on the card endpoint and public page. Revert the PR to roll back.

## Notes for future agents
Never read `NEXT_PUBLIC_SITE_URL` directly; call `getSiteUrl()`.

## Related
[contact-card-share](2026-10-24-contact-card-share.md)
