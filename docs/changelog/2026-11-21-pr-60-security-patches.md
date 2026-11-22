---
pr: 60
issues: []
date: 2026-11-21
branch: fix/security-2026-11-21
merge_commit: 68c3425
author: lead-chief-of-staff (overnight run)
ids: []
areas: [package.json, package-lock.json]
type: security
status: merged
---

# Next.js security patch and in-range dependency fixes

## Summary
Next.js moves from 16.4.3 to 16.4.6, a patch in the same major version, which closes 7 moderate advisories (cookie exposure on Edge routes, cache leaks and poisoning, an SVG check bypass in image optimization). `npm audit fix` also updated transitive dependencies in the lockfile. No user-visible change.

## Context
Nightly security run. `npm audit` found 14 moderate issues before this change and 7 after.

## What changed
- `package.json`: `next` and `eslint-config-next` pinned to `16.4.6`.
- `package-lock.json`: in-range transitive updates from `npm audit fix`.

## Decisions and alternatives
- The exact pin on `next` blocks `npm audit fix`, so it was bumped by hand. This was an overnight decision: it's a patch-level change, and the alternative was to leave it open.
- `npm audit fix --force` was not used. See below for the advisories that remain.

## Assumptions and open questions
- fflate (via `@vercel/og` → `satori`): npm's only fix is a breaking downgrade to `@vercel/og@1.0.1`. Waiting for upstream.
- minimatch (via `shadcn` CLI and `@typescript-eslint`): affects dev and lint tools only. npm's fix is a major downgrade of `shadcn`.

## Interfaces, data and configuration
Dependency versions only. No schema, API or env changes.

## Verification
Fresh `npm ci`, then lint, typecheck and unit tests all pass.

## Known limitations and follow-ups
The 7 remaining moderate advisories are listed above.

## Risks and rollback
Low. If anything breaks, revert this PR, or set the two pins back to `16.4.3` and run `npm install`.

## Notes for future agents
`next` and `eslint-config-next` are pinned exactly and must move together.

## Related
None.
