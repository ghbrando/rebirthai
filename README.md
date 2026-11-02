# RebirthAI

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
| `NEXT_PUBLIC_FEEDBACK_URL` | optional; where the small "Send feedback" link on every signed-in screen goes (a form link or `mailto:`). Link hidden when unset. Read at build time. |
| `REPORT_WEBHOOK_URL` | optional, **server-only**; an ntfy.sh topic URL or any webhook that takes a plain-text POST, notified when a page is reported (`docs/OPERATIONS.md`) |
| `OPERATOR_CONTACT_EMAIL` | optional; shown to an author whose page was taken down so they can reach the operator |
| `COACH_MODEL_INTERVIEW`, `COACH_MODEL_DRAFT`, `COACH_MODEL_SUGGEST` | optional; Claude model per coach step (`claude-opus-5-5` default; also `claude-sonnet-5-5`, `claude-haiku-5-5`). Change only after the coach truthfulness check (#10). |

### Database

Apply the files in `supabase/migrations/` in order (Supabase SQL editor, or `supabase db push`). `0001_init.sql` creates all tables, RLS policies, public views, the `media-private` / `media-public` buckets and storage policies; `0002_retired_handles.sql` keeps the handles of deleted accounts from ever being reused; `0003_takedown.sql` lets the operator take a reported page down and restore it.

In Supabase Auth settings, enable Email (magic link) and Google, and add `http://localhost:3000/auth/callback` (and your Vercel URL) as redirect URLs.

### Local test environment (fictional data)

Reviews, demos and screenshots run against a local Supabase seeded with made-up people, never
a hosted project. Needs Docker and the Supabase CLI (on the team's Windows machine they live in
WSL Ubuntu: prefix the `supabase` commands with `wsl -d Ubuntu -u root --` and run them from the
repo's `/mnt/c/...` path).

```bash
supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor  # applies migrations
supabase status -o env        # local keys (shared local defaults, not secrets)
SUPABASE_URL=http://localhost:54321 SUPABASE_SERVICE_ROLE_KEY=<secret key> node scripts/seed-demo.mjs
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key> \
SUPABASE_SERVICE_ROLE_KEY=<secret key> NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
DEMO_MODE=1 DEMO_EMAIL=demo@rebirthai.local npm run dev
```

Open `/demo` to sign in as Maria (published testimony at `/@maria_g`). `newcomer@rebirthai.local`
is a signed-up user with nothing written. The coach needs `ANTHROPIC_API_KEY`; every other
screen works without it. `supabase stop` when done.

WSL notes: use `localhost`, not `127.0.0.1` (Windows reaches WSL ports over IPv6 here). WSL
shuts down, and the database with it, when no WSL process is attached, so keep one open while
working: `wsl -d Ubuntu -- sleep infinity` in the background.

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
