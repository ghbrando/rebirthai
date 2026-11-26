---
pr: 63
issues: []
date: 2026-11-26
branch: fix/security-2026-11-26
merge_commit: pending
author: lead-chief-of-staff (overnight run)
ids: []
areas: [package-lock.json]
type: security
status: open
---

# shadcn CLI patch (minimatch advisory)

## Summary
The `shadcn` CLI moves from 4.23.0 to 4.23.1 (patch, same major), which pulls a fixed `minimatch` through `ts-morph`. Closes 4 of the 7 moderate advisories. Dev tooling only; no user-visible change.

## Context
Nightly security run. `npm audit` found 7 moderate issues before this change and 3 after.

## What changed
- `package-lock.json`: `shadcn` 4.23.1, `ts-morph` 28.0.0 and `@ts-morph/common` 0.29.1 (transitive, required by the shadcn patch), nested `minimatch` 11.0.9. `package.json` is unchanged.
- Lockfile regenerated on Linux and resynced with `npm install --package-lock-only`: plain `npm audit fix` left it out of sync with the WebAssembly fallback packages, and `npm ci` would have failed in CI.

## Decisions and alternatives
- `npm audit fix --force` was not used.

## Assumptions and open questions
- fflate (via `@vercel/og` → `satori`, 3 advisories): npm's only fix is a breaking downgrade to `@vercel/og@1.0.1`. Still waiting for upstream; not applied.

## Interfaces, data and configuration
Dependency versions only. No schema, API or env changes.

## Verification
Fresh `npm ci` on Linux (container) and on Windows, then lint, typecheck and unit tests all pass.

## Known limitations and follow-ups
- Recheck fflate / `@vercel/og` in the next nightly run.
