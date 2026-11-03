---
pr: 47
issues: [14]
date: 2026-11-02
branch: feature/14-smoke-test
merge_commit: pending
author: implementation engineer
ids: [US-01, US-13]
areas: [e2e, playwright.config.ts, package.json, README.md]
type: infra
status: merged
---

# Smoke test of the full demo path

## Summary
`npm run smoke` walks the demo path on a phone-sized screen against a running local app and saves screenshots to `test-results/`, so a broken demo is caught before anyone shows it.

## Context
Issue #14: the demo path had never been tested end to end. This delivers the part that works with the local test environment (seeded Maria, `DEMO_MODE=1`).

## What changed
- `e2e/smoke.spec.ts`: landing loads; `/demo` signs in and the dashboard says "published"; `/coach /editor /preview /publish /share /contact /settings` each return 200 with no console errors; `/@maria_g` shows her story; `/api/vcard/maria_g` is vCard 3.0 with a `/@maria_g` URL; the QR image renders on `/share`.
- `playwright.config.ts`: 390x844 viewport, `BASE_URL` (default `http://localhost:3000`), one worker, output under `test-results/`.
- `package.json`: `smoke` script; `@playwright/test` pinned to `1.64.1` (it was already listed as `^1.64.1`; lockfile entries edited by hand to match, now marked dev).
- `.gitignore`: `/test-results/`, `/playwright-report/`. README: "Smoke test" section.

## Decisions and alternatives
- Runner: `@playwright/test`, not the plain library plus a script. It was already in the lockfile at 1.64.1, so pinning needed no new package.
- Dev-server not started by the test: the app must already be running (shared-machine rule, and it needs the local Supabase).
- Not in CI: CI has no database.
- vCard is fetched from the route, not clicked, so no download dialog handling is needed; the share button links to the same route.

## Assumptions and open questions
- The Issue's wider criteria (create a test user, run a 3-turn coach conversation, add an image, publish, signed-out context) are not covered. The coach needs `ANTHROPIC_API_KEY` and the demo path uses the seeded user. Issue #14 stays open for those. The Issue is also marked `blocked` on I-17.
- Not yet run: the author of this change was told not to start the app or browsers. First run is by the Lead.

## Interfaces, data and configuration
Env: `BASE_URL` (optional). New dev script `smoke`. No app code changed.

## Verification
`npm run lint && npm run typecheck && npm test`: clean, 76 tests pass. `npm run smoke` not run here (see above).

## Known limitations and follow-ups
Console-error check is strict; any dev-server noise on those pages will fail the test and should be fixed or filtered on purpose.

## Risks and rollback
Test-only. Remove `e2e/`, `playwright.config.ts` and the script to undo. `vitest.config.ts` already excludes `e2e/**`.

## Notes for future agents
The story heading assertion depends on the title in `scripts/seed-demo.mjs`.

## Related
`2026-11-01-local-test-env.md`, `2026-10-24-integration-demo-mode.md`.
