---
pr: 34
issues: []
date: 2026-11-01
branch: feature/local-test-env
merge_commit: pending
author: Lead (agent), UX review by ux-language-advocate
ids: [RC-07]
areas: [supabase/config.toml, scripts/seed-demo.mjs, app/(auth)/sign-in, README.md, CLAUDE.md]
type: infra
status: open
---

# Local test environment with fictional data, and a demo sign-in loop fix

## Summary
Anyone working on RebirthAI can now run the full app against a local database seeded with
made-up people (Maria with a published testimony, plus an empty newcomer), so reviews, demos and
screenshots never touch real accounts. Running it surfaced a redirect loop on demo sign-in,
fixed here.

## Context
Owner decision (2026-10-27): verification runs on a local environment with fictional data.
Work started on `feature/local-demo-env` (config and seed, untested because Docker wasn't ready);
this branch finishes and verifies it on top of current `dev`.

## What changed
- `supabase/config.toml` (project_id `rebirthai`) and `supabase/.gitignore`: local Supabase that
  applies `supabase/migrations` on start.
- `scripts/seed-demo.mjs`: idempotent seed of fictional users and content; refuses non-local URLs.
- `app/(auth)/sign-in/page.tsx`: in demo mode the page no longer redirects to `/demo` when an
  `error` is present. Before, a failed demo sign-in bounced between `/demo` and `/sign-in` forever.
- README "Local test environment" section; CLAUDE.md points to it.

## Decisions and alternatives
- Supabase runs in Docker inside WSL Ubuntu on the Windows host, not Docker Desktop (needs a GUI;
  the host is headless).
- Windows reaches WSL ports over IPv6 `localhost`, not `127.0.0.1`. Documented instead of
  changing the host's WSL network config.
- WSL stops when no WSL process is attached; documented a `sleep infinity` keep-alive instead
  of changing the host's idle timeout.

## Assumptions and open questions
None.

## Interfaces, data and configuration
No schema change. Uses the existing env vars; local keys are Supabase's shared local defaults,
passed on the command line, never committed.

## Verification
Local Supabase started with the migration applied; seed ran; `/demo` signs in and lands on the
dashboard; all ten main screens and `/@maria_g` load at phone size with no console errors; vCard
download returns a valid 3.0 card. Lint, typecheck and unit tests pass.

## Known limitations and follow-ups
- The coach needs a real `ANTHROPIC_API_KEY`; other screens work without it.
- UX review of the screenshots produced beta follow-ups filed as Issues (spec labels such as
  "Screen 8" in the UI, inconsistent link formats, publish/visibility wording, delete safety).

## Risks and rollback
Dev-only. Revert the commit; the sign-in change only affects `DEMO_MODE=1`.

## Notes for future agents
If the database "disappears" mid-session (fetch failed), WSL went idle: keep a WSL process open.
Re-running the seed is safe.

## Related
`docs/changelog/2026-10-24-integration-demo-mode.md`; ARCHITECTURE rule 5 (demo mode never on a
deployed site).
