---
pr: none (committed directly to main; backfilled record)
issues: [2]
date: 2026-10-24
branch: main
merge_commit: 34e3e46
author: hackathon lead agent (Phase 0 of docs/BUILD_PROMPT.md)
ids: [RC-01, RC-02, RC-03, RC-07, DD-06]
areas: [supabase/migrations/0001_init.sql, lib/types.ts, lib/supabase, lib/auth.ts, proxy.ts, next.config.ts, app]
type: infra
status: merged
---

# Foundation: app scaffold, Supabase schema with RLS, shared types, routes for every screen

## Summary
The contract every feature was built against: one Next.js app, Supabase clients and session
helpers, the full database schema with Row-Level Security, shared TypeScript types, and an empty
route for each of the 14 screens in the SDD, including the `/@handle` rewrite.

## Context
Backfilled from git history (`34e3e46`). The build prompt made Phase 0 sequential and owned by the
lead agent so five parallel agents could build features without editing shared files.

## What changed
- `supabase/migrations/0001_init.sql`: tables `profiles`, `testimonies` (`draft_content`,
  `published_content`, `published_title`, `status`, `visibility`), `coach_messages`, `media`,
  `handle_redirects`, `reports`; RLS on all of them; anon-readable views `public_profiles`,
  `public_testimonies`, `handle_lookup`; buckets `media-private` and `media-public`.
- `lib/types.ts`: row types, testimony content JSON (blocks incl. image/video), handle rule
  `[a-z0-9_]{3,30}`, media size limits.
- `lib/supabase/server.ts` (server client + `createServiceClient`), `lib/supabase/client.ts`,
  `lib/auth.ts` (`requireUser`, `getUserOrNull`), `proxy.ts` (session-cookie refresh only).
- `next.config.ts`: rewrite `/@:handle` → `/u/:handle`.
- `app/**`: placeholder page per screen (`components/page-stub.tsx`).

## Decisions and alternatives
- **Public reads go through views**, not policies on base tables, so anonymous visitors can never
  select private columns (contact fields appear only when `share_contact` is on).
- **`/u/[handle]` + rewrite** instead of an `@handle` folder, because `@` folders are parallel-route
  slots in the App Router.
- **`proxy.ts` refreshes cookies but does not authorize.** Each route checks the session itself
  (RC-01); hiding UI is not protection.
- **One migration file** for the hackathon. From now on schema changes go in new files.

## Assumptions and open questions
- One testimony per profile (DD-08); the schema allows more later (OQ-02).

## Interfaces, data and configuration
Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
(server only), `ANTHROPIC_API_KEY` (server only), `NEXT_PUBLIC_SITE_URL`. See `.env.example`.

## Verification
`npm run typecheck` and `npm run build` passed at the time (per the build). Never applied to a real
Supabase project yet (#18).

## Known limitations and follow-ups
Migration untested against a live database (#18).

## Risks and rollback
RLS mistakes would leak private drafts; any change to policies or views needs the security reviewer.

## Notes for future agents
- Never edit `0001_init.sql` after it is applied; add `0002_*.sql`.
- If you add a column that the public page needs, expose it through the view, not by loosening RLS.
- `createServiceClient` bypasses RLS: allowed only in publish, report and demo (ARCHITECTURE rule 4).

## Related
`docs/ARCHITECTURE.md` §3, §6 · SDD §5.3 · all later records build on this.
