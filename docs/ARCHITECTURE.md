# RebirthAI — Architecture

Durable structure and rules every change must preserve. Behavior and IDs come from the SDD
(`docs/sdd/RebirthAI_SDD.html`); task detail lives in GitHub Issues. Change this file only
through a reviewed decision, not as a side effect of a feature.

## 1. System at a glance

One Next.js (App Router, TypeScript) app on Vercel, one Supabase project, one AI provider.

```
Browser (author, PWA)  ──HTTPS──▶  Next.js on Vercel ──server-only key──▶ Anthropic API
Recipient phone        ──tap URL─▶   ├─ author screens (app/(app), app/(auth), onboarding, settings)
                                     ├─ public page  /@handle → /u/[handle]  (server-rendered)
                                     └─ route handlers  app/api/*            ──RLS──▶ Supabase Postgres
Browser ──signed direct upload────────────────────────────────────────────────────▶ Supabase Storage
```

## 2. Components and ownership

| Area | Paths | Responsibility |
|---|---|---|
| Auth & profile | `app/(auth)`, `app/auth/callback`, `app/onboarding`, `app/settings`, `components/profile` | Sign-in, session, profile, handle changes |
| AI coach | `app/api/coach/**`, `lib/ai/**`, `app/(app)/coach`, `components/coach` | Interview, draft, suggestions, rate limit, crisis rules |
| Editor & media | `app/(app)/editor`, `app/api/upload-url/**`, `lib/media/**`, `components/editor` | Draft editing, suggestion accept/reject, uploads, EXIF strip |
| Publish & public page | `app/(app)/preview`, `app/(app)/publish`, `app/api/publish`, `app/u/**`, `app/api/og`, `app/api/report`, `components/testimony` | Snapshot publishing, public rendering, link previews, reports |
| Contact & share | `app/api/vcard/**`, `lib/vcard/**`, `app/(app)/contact`, `app/(app)/share`, `components/share` | vCard 3.0, QR, add-to-contact guide, sharing |
| Shared contract | `supabase/migrations/**`, `lib/types.ts`, `lib/supabase/**`, `lib/auth.ts`, `proxy.ts` | Schema, types, clients, session helpers |

## 3. Data model (summary — full detail in SDD §5.3 and the migration)

`profiles` (one per user; opt-in contact fields) · `testimonies` (one per profile; separate
`draft_content` and `published_content` JSON) · `coach_messages` (private) · `media` ·
`handle_redirects` (old handle → profile, permanent) · `reports`.
Storage buckets: `media-private` (drafts, signed URLs) and `media-public` (published).

## 4. Key data flows

- **Coach:** browser → `/api/coach` → verify session → load history → Claude (cached system prompt) → stream reply → persist message.
- **Media:** browser → `/api/upload-url` for a signed URL → upload directly to `media-private`; never through a Vercel function.
- **Publish:** copy `draft_content` → `published_content`, move media to `media-public`. Later edits do not go live until republished.
- **Recipient:** contact URL → `/@handle` rewrite → `/u/[handle]` → resolve handle (and `handle_redirects`) → render published snapshot server-side.

## 5. Architectural decisions (from the SDD)

DD-01 web app/PWA, no native apps · DD-02 permanent handle URL · DD-03 .vcf + QR, no device
Contacts access · DD-04 interview-then-draft · DD-05 separate draft and published copies ·
DD-06 Next.js + Supabase single stack · DD-07 all AI calls server-side and streaming ·
DD-08 one testimony per profile (MVP).

## 6. Rules agents must preserve

**Security boundaries**
1. Every route that reads private data or changes data verifies the session on the server with `requireUser()` / `getUserOrNull()`. `proxy.ts` only refreshes cookies; it is not authorization (RC-01).
2. Ownership is enforced by Postgres RLS. Never disable RLS or widen a policy to make a feature work (RC-02).
3. `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are used only in server code. Never import `lib/supabase/server` or the Anthropic SDK from a `"use client"` file, and never prefix a secret with `NEXT_PUBLIC_` (RC-07).
4. The service-role client (`createServiceClient`) is allowed only where RLS cannot express the operation: publish (moving media), reporting, and the demo route. Any new use is an escalation.
5. **`/demo` signs anyone in as `DEMO_EMAIL` without an email step. `DEMO_MODE` must never be set in a deployed (preview, staging or production) environment.**

**Data and URL invariants**
6. The testimony URL is `/@handle`, resolved through `handle_redirects`; old handles redirect forever and are never reassigned (RC-03).
7. Public pages read only `published_content` and public profile fields; drafts and conversations never render publicly (RC-06).
8. Schema changes go in a new migration file, with RLS for any new table, and matching updates to `lib/types.ts`. Never edit `0001_init.sql` after it has been applied.

**AI behavior**
9. The model writes nothing to the author's draft directly except draft generation from the author's own answers; refinements are returned as suggestions (RC-04).
10. The coach system prompt keeps the truthfulness and crisis rules (RC-04, RC-05) and prompt caching; the per-user rate limit stays on (RC-08).

**Platform**
11. Media uploads go browser → Supabase Storage with signed URLs (RC-09). Files pass through no Vercel function.
12. This is a recent Next.js with breaking changes: read the relevant guide in `node_modules/next/dist/docs/` before using framework APIs (see `AGENTS.md`).

## 7. Allowed and forbidden relationships

| From | May call | Must not |
|---|---|---|
| Client components | Route handlers in `app/api/*`, Supabase browser client (anon key, RLS) | Import server clients, secrets or the Anthropic SDK |
| Route handlers / server components | Supabase server client, Anthropic SDK, `lib/*` | Return another user's private rows; log message content or secrets |
| Public page `app/u/**` | Published data and public profile fields | Read drafts, conversations or private media |
| `lib/*` shared modules | Each other | Import from `app/` or `components/` |

## 8. Where to look next

SDD (behavior, IDs) · `docs/POLICY.md` (domain and privacy rules) · `docs/ROADMAP.md` (direction) ·
GitHub Project https://github.com/users/ghbrando/projects/2 (tasks and status) ·
`docs/IMPLEMENTATION_PLAN.md` (phases and traceability).
