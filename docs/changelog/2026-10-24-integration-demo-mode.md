---
pr: none (committed directly to main; backfilled record)
issues: []
date: 2026-10-24
branch: main
merge_commit: f56d602, 46edba4
author: hackathon lead agent (Phase 2 integration)
ids: []
areas: [.gitignore, eslint.config.mjs, vitest.config.ts, app/demo, app/(auth)/sign-in, app/page.tsx]
type: infra
status: merged
---

# Integration of the five feature branches, and a one-click demo sign-in

## Summary
After merging the five feature branches, lint and tests were set to ignore agent worktree folders,
and a demo-only sign-in was added so the hackathon demo could skip the email step.

## Context
Phase 2 of `docs/BUILD_PROMPT.md`. The Playwright smoke test and the five-session coach review from
that phase were **not** done (now #14 and #10).

## What changed
- `f56d602`: `.gitignore`, `eslint.config.mjs`, `vitest.config.ts` exclude agent worktrees so
  parallel-agent checkouts don't break lint and tests.
- `46edba4`: `app/demo/route.ts` signs in as `DEMO_EMAIL` by generating and verifying a magic link
  server-side with the service-role client, only when `DEMO_MODE=1`; the landing page's "Get started"
  goes to `/demo` in demo mode.

## Decisions and alternatives
- Demo sign-in chosen over a seeded password account to keep the real auth flow unchanged.

## Assumptions and open questions
None.

## Interfaces, data and configuration
Env: `DEMO_MODE`, `DEMO_EMAIL`. Uses `SUPABASE_SERVICE_ROLE_KEY`.

## Verification
Build green per the build report.

## Known limitations and follow-ups
Missing E2E test (#14) and coach review (#10).

## Risks and rollback
**With `DEMO_MODE=1`, anyone can sign in as the demo account with no email step.** Never set it in
a deployed environment (ARCHITECTURE rule 5, plan RISK-09). Rollback: unset the variable; the route
then returns 404.

## Notes for future agents
- Check that `DEMO_MODE` is unset in Vercel before any deploy (#19).
- The demo account's data is real data in that Supabase project; don't demo with personal stories.

## Related
[foundation](2026-10-24-foundation.md) · ARCHITECTURE rule 5
