---
pr: 24
issues: []
date: 2026-10-27
branch: docs/project-setup
merge_commit: pending
author: Lead agent
ids: [RC-07, RC-04, DD-04]
areas: [.claude/hooks, .claude/settings.json, .claude/agents, .github/workflows, CLAUDE.md, package.json, package-lock.json, .gitignore, docs/current_feature_plans]
type: infra
status: open
---

# Guardrails, automatic PR checks and project instructions for agents

## Summary
Every pull request now runs lint, type-check and unit tests automatically (`lint-typecheck-test`).
Agents working in this repo are blocked from pushing to or approving `staging`/`main` and from
reading local secret files. The project `CLAUDE.md` now tells agents how to run, test and where
the rules live, and a RebirthAI-specific domain-expert role guards testimony and coach rules.

## Context
Stage 5 of `/project-setup` (CSCI 5520 Lab 4 readiness). Stages 1–4 (rulesets, GitHub Project,
plan, Issues, ARCHITECTURE/POLICY/ROADMAP, change records) were already done in #21–#23. Before
this, nothing ran on PRs and branch safety relied on rulesets alone.

## What changed
- `.github/workflows/checks.yml`: job `lint-typecheck-test` on PRs into dev/staging/main; Node 24;
  `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`. Read-only token, no secrets.
- `package.json`: `typecheck` is now `next typegen && tsc --noEmit`. Next's generated route types
  (e.g. `LayoutProps` in `app/layout.tsx`) do not exist on a clean checkout, so plain `tsc` failed.
- `package-lock.json`: regenerated from scratch. The old lockfile, made on Windows, lacked top-level
  `@emnapi/runtime` and `@emnapi/core` (optional deps of `@img/sharp-wasm32`), so `npm ci` failed on
  Linux. Direct dependencies are unchanged; ~26 transitive versions moved (mostly patch).
- `.claude/hooks/guard.mjs` + `.claude/settings.json`: PreToolUse guard for Bash/PowerShell and
  Read/Edit deny rules for local secret files.
- `.claude/agents/domain-expert.md`: testimony truthfulness, coach limits, permanent handles,
  faith framing (OQ-03), vocabulary from POLICY §3.
- `CLAUDE.md`: merged the hackathon note with run/test commands, sources of truth, workflow and
  owner-only decisions (D-01–D-05, schema/RLS, RC-07, RC-04).
- `.gitignore`: `.claude/` replaced by `.claude/worktrees/` and `.claude/settings.local.json`, so the
  shared settings and hook are committed.
- `docs/current_feature_plans/.gitkeep`: active-work registry for feature cycles.

## Decisions and alternatives
- **Regenerate the lockfile** rather than switching CI to `npm install` (would hide lockfile drift)
  or adding `@emnapi/*` to package.json (pins something we don't use directly).
- **Node 24 in CI** (npm 11) to match the npm used to produce the lockfile; Node 22's npm 10 resolves
  optional dependencies differently.
- **Check proven before being required**: a deliberately broken file (`lib/ci-proof.test.ts`) was
  pushed, the check failed at Type-check, and the file was removed. Making the check required is the
  owner's step (`require-checks.sh`), since requiring it before it has run blocks every PR.

## Assumptions and open questions
- The guard matches the text `.env` anywhere in a shell command, including commit messages; reword
  rather than bypass if it blocks a harmless command.

## Interfaces, data and configuration
No schema, API or env-var changes. New status check name: `lint-typecheck-test` (rulesets will
reference it by that name; renaming the job silently un-requires it).

## Verification
- Locally (Windows, fresh `npm ci` from the new lockfile): lint, typecheck, 7/7 unit tests pass.
- CI with the broken file: Install and Lint passed, Type-check failed as intended.
- CI after removing it: see PR #24 checks.
- Guard: `git push origin main` exits 2 (blocked); `git status` exits 0.

## Known limitations and follow-ups
- Owner: run `require-checks.sh ghbrando/rebirthai` to require `lint-typecheck-test` on dev/staging/main.
- No end-to-end (Playwright) tests in CI; they need Supabase credentials.

## Risks and rollback
Transitive version bumps could change behavior; checks pass and core packages (next, react,
supabase, anthropic, tiptap) are unchanged. Roll back by reverting this PR.

## Notes for future agents
- Run `npm run typecheck`, not bare `tsc`: route types must be generated first.
- If `npm ci` fails in CI with "Missing ... from lock file", regenerate the lockfile with
  `node_modules` moved aside; `npm install --package-lock-only` alone reuses installed packages.

## Related
`docs/changelog/2026-10-26-pr-23-change-records.md`, `docs/ARCHITECTURE.md`, `docs/POLICY.md`.
