# RebirthAI — MVP Build Prompt (for an orchestrating agent)

You are the lead engineer building the RebirthAI hackathon MVP. Speed matters: favor a working end-to-end demo over polish. You orchestrate subagents for parallel work, then integrate and verify.

## Source of truth
- Read `docs/sdd/RebirthAI_SDD.html` in full before doing anything (it is the text source of `docs/RebirthAI_SDD.pdf`). It defines user stories `US-01`–`US-15`, constraints `RC-01`–`RC-14`, design decisions `DD-01`–`DD-08`, the data model (§5.3), and the screen flow (§6.1, screens 1–14).
- Reference story/constraint IDs in commit messages, code comments where useful, and your final report.
- Where the SDD leaves an open question (`OQ-xx`), use the MVP assumption it states. Do not stop to ask about them.

## Stack (fixed — do not substitute)
Next.js (App Router, TypeScript) · Tailwind CSS + shadcn/ui · Supabase (Auth, Postgres with RLS, Storage) · Anthropic TypeScript SDK (`@anthropic-ai/sdk`) with model `claude-opus-5-5`, adaptive thinking, streaming · TipTap editor · `qrcode` npm · `@vercel/og` · deploy target Vercel.

Notes:
- `/@handle` cannot be a folder name in the App Router (`@` folders are parallel-route slots). Implement the page at `app/u/[handle]` and add a rewrite in `next.config` from `/@:handle` to `/u/:handle`.
- All Claude calls happen server-side in route handlers. Never expose `ANTHROPIC_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the client (RC-07).

## Credentials
At the very start, check for `.env.local`. If `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `ANTHROPIC_API_KEY` are missing, ask the user for them **once**, then keep working on everything that doesn't need them while you wait. Commit only `.env.example`, never real values.

## Repo & git rules
- Repo: `https://github.com/ghbrando/rebirthai` (remote is empty). Work on `main` (rename local `master` to `main`).
- Commit in small, meaningful steps. **Do not add any AI/Claude attribution or co-author lines to commits or PRs.**
- **Ask the user before any `git push`**, before deleting anything, and before installing anything system-wide (project-local `npm install` is fine).
- Keep `README.md` current: what RebirthAI is, setup, env vars, how to run locally, how to apply the DB migration, how to deploy.

## Phase 0 — Foundation (you, sequential, before spawning anyone)
This phase is the contract every subagent builds against. Do it yourself and commit it before Phase 1.
1. Scaffold Next.js + TypeScript + Tailwind + shadcn/ui; ESLint; `npm run typecheck` script.
2. Supabase clients: `lib/supabase/server.ts`, `lib/supabase/client.ts`, middleware for session refresh, and an `requireUser()` helper.
3. One SQL migration in `supabase/migrations/` creating every table from SDD §5.3 (`profiles`, `testimonies` with `draft_content` + `published_content` JSON, `coach_messages`, `media`, `handle_redirects`, `reports`), **with RLS policies** (RC-02): owners read/write their own rows; anonymous users can read only published testimonies and public profile fields. Create storage buckets `media-private` and `media-public`.
4. Shared types in `lib/types.ts` (DB rows + testimony content JSON shape, including image/video blocks).
5. App shell + routing skeleton for screens 1–14 (empty pages with titles), nav, and the `/@handle` rewrite.
6. `.env.example`, README skeleton. Confirm `npm run build` passes. Commit.

## Phase 1 — Parallel subagents
Spawn these five subagents in parallel, each in its own git worktree/branch (`feat/<name>`). Give each one: the SDD path, this file, the stories/constraints it owns, the files/directories it **owns** (it must not edit files outside them except to add small exports; shared changes to `lib/types.ts` or the migration go through you), and the acceptance checks from the SDD. Each must run `npm run typecheck && npm run build` before reporting and return: what it built, files changed, any deviations, and anything left undone.

| Agent | Owns stories / constraints | Owns paths (suggested) | Key deliverables |
|---|---|---|---|
| **A · Auth & Profile** | US-01, US-02, screen 11 settings, RC-01, RC-12 | `app/(auth)/**`, `app/onboarding/**`, `app/settings/**`, `components/profile/**` | Email magic link + Google sign-in, redirect guards, profile setup (handle validation 3–30 `[a-z0-9_]`, uniqueness, photo upload), settings incl. opt-in contact phone/email + `share_contact` toggle, handle change writes `handle_redirects` (RC-03) |
| **B · AI Coach** | US-03, US-04, US-05, RC-04, RC-05, RC-08 | `app/api/coach/**`, `lib/ai/**`, `app/(app)/coach/**`, `components/coach/**` | Streaming chat route (verify session, load history, persist messages), system prompt implementing the before/turning point/after interview one question at a time, truthfulness rules (no invented details), crisis handling with 988 resources, prompt caching on the system prompt, per-user rate limit (~60 msgs/hr). Endpoints for **draft generation** (writes `draft_content`) and **refinement suggestions** (returns proposed edits, never overwrites). Resume from history. |
| **C · Editor & Media** | US-06 (editor side), US-07, RC-06, RC-09, RC-11 | `app/(app)/editor/**`, `app/api/upload-url/**`, `components/editor/**` | TipTap editor bound to `draft_content` with autosave, image/video blocks with caption + required alt text, accept/reject UI for coach suggestions (consumes agent B's suggestion endpoint — agree on the JSON shape via `lib/types.ts`), signed **resumable** direct uploads to `media-private`, type/size limits (images ≤10 MB JPG/PNG/WebP, video ≤100 MB MP4/MOV), strip image EXIF/GPS |
| **D · Publish & Public Page** | US-08, US-12, US-13, US-14, US-15, RC-03, RC-06, RC-11, RC-13 | `app/(app)/preview/**`, `app/(app)/publish/**`, `app/u/**`, `app/api/og/**`, `app/api/report/**`, `components/testimony/**` | Preview that uses the same renderer as the public page, publish (copy draft → published, move media to public bucket), unpublish, delete (rows + storage), server-rendered `/u/[handle]` with handle-redirect lookup, not-found/unavailable states, `noindex` for unlisted, OG metadata + `@vercel/og` image, tap-to-play video, Report link, "Save contact" button when `share_contact` is on |
| **E · Contact Card & Share** | US-09, US-10, US-11, RC-10 | `app/api/vcard/**`, `lib/vcard/**`, `app/(app)/contact/**`, `app/(app)/share/**`, `components/share/**` | vCard 3.0 builder (FN, N, TEL, EMAIL, URL, NOTE; UTF-8; proper escaping and line folding) with **unit tests**, `/api/vcard/[handle]` serving `text/vcard` as `.vcf`, QR code encoding the full vCard text (no photo), "Add to my contact info" screen shown right after publish with step-by-step iPhone and Android guides, share screen with QR, copy link, and Web Share API |

## Phase 2 — Integrate & verify (you)
1. Merge the five branches into `main`, resolving conflicts. Run `npm run typecheck`, `npm run lint`, `npm run build`, and unit tests — all must pass.
2. Write and run one Playwright smoke test for the demo path: sign in (use a test user / Supabase admin API) → profile setup → coach conversation (3+ turns) → generate draft → add an image → preview → publish → download `.vcf` and assert it contains the testimony URL → open `/@handle` in a fresh signed-out context and see the story.
3. Manually review five coach sessions for invented details (US-05) and fix the prompt if any appear.
4. Fix anything broken. Update README. Commit.
5. Report to the user: what works (by US-ID), what's partial or skipped and why, how to run it, and what needs their action (credentials, Supabase project setup, Vercel deploy, push approval). Report test results faithfully, including failures.

## Out of scope (do not build)
Native apps, social feed/follows/comments/messaging, recipient accounts, AI-generated media, translation, org/admin dashboards, payments, video transcoding (SDD §2.3).
