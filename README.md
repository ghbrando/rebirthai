# RebirthAI

## Lament

As Christians, it matters to know why someone is baptized. We feel it is tough to share a testimony of how Jesus has changed someone. The Gospel has saved believers, and we want to know why. Forming a testimony requires being prompted by Jesus. 

## Discern

Sharing our testimonies online would bring glory to God, but not everyone wants to have their information online. Because understanding what Jesus has done in our lives involves a relationship with Him, we thought it would be best to help Christians write to Him. Through chatting with an AI coach, we could form a testimony.

## Build

We created a model that is designed to help Christians share their beliefs:
https://github.com/user-attachments/assets/218e19f5-bf97-4287-9cdb-083862a09808

## Steward

God pushed us to preach our testimony to people on God’s earth. It worked. We took it a step further and included our testimony. Now we can make testimonies more powerful.

# Product Specification

AI-guided testimony platform: write your story with an AI coach, add photos/video, publish it at a permanent `/@handle` URL, and put that URL on your contact card (vCard + QR) so it travels with you. Source of truth: `docs/sdd/RebirthAI_SDD.html`.

Stack: Next.js (App Router, TS) · Tailwind + shadcn/ui · Supabase (Auth, Postgres+RLS, Storage) · Anthropic SDK (`claude-opus-5-5`) · TipTap · `qrcode` · `@vercel/og`.

## Setup

```bash
npm install
```

Create `.env.local` with:

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** (RC-07) |
| `ANTHROPIC_API_KEY` | **server-only** (RC-07) |
| `NEXT_PUBLIC_SITE_URL` | public origin, e.g. `http://localhost:3000` |

### Database

Apply `supabase/migrations/0001_init.sql` (Supabase SQL editor, or `supabase db push`). It creates all tables, RLS policies, public views, the `media-private` / `media-public` buckets and storage policies.

In Supabase Auth settings, enable Email (magic link) and Google, and add `http://localhost:3000/auth/callback` (and your Vercel URL) as redirect URLs.

## Run

```bash
npm run dev        # http://localhost:3000
npm run typecheck
npm run lint
npm run build
npm test           # unit tests (vitest)
```

`/@handle` is rewritten to `/u/[handle]` (see `next.config.ts`).

## Deploy

Push to GitHub, import into Vercel, set the env vars above (secrets as server-side only), set `NEXT_PUBLIC_SITE_URL` to the production origin.
