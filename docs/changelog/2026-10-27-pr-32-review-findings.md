---
pr: 32
issues: [10, 29]
date: 2026-10-27
branch: fix/review-findings
merge_commit: pending
author: Lead agent, from QA, security and domain specialist reviews
ids: [RC-04, RC-07, RC-08, RISK-04, OQ-04]
areas: [.claude/hooks, .claude/settings.json, .gitignore, lib/ai/usage.ts, app/api/coach, docs/BETA_PLAN.md, docs/ROADMAP.md, docs/issues.json]
type: fix
status: open
---

# Fixes from the specialist review of PRs #24, #30 and #31

## Summary
A catch-up review by QA, security and domain specialists found no serious issues but several
real gaps. This PR closes them: the agent guardrail can no longer be bypassed in the ways
found, AI cost logging now counts failed calls and the model that actually answered, secret-file
rules are wider, and the domain expert's rules for the coach check and for Discovery are recorded.

## Context
PRs #24, #30 and #31 merged without specialist review, because this session's environment told the
Lead not to start helper agents unless asked; the owner's routing rules are now the standing request
(global CLAUDE.md). Findings: QA (guard bypasses, unlogged failed calls, fallback cost), security
(guard bypasses incl. `gh api`, narrow .env rules, `.claude/` ignore, log linkability), domain
(sensitive-disclosure, minors, church vetting, doctrine neutrality, crisis, feed pressure, "fit"
wording, coach scripture and leading-question tests).

## What changed
- `.claude/hooks/guard.mjs`: skips git global options (`git -C dir push`), inspects quoted/wrapped
  commands (`bash -c '...'`), resolves `HEAD`/`@` to the current branch, compares branch names
  case-insensitively, blocks `gh api` writes that merge, review or move refs (REST and GraphQL),
  widens the secret-file reader list, and blocks when its input can't be parsed.
- `.claude/hooks/guard.check.mjs` (new): 29 regression cases; run `node .claude/hooks/guard.check.mjs`.
- `.claude/settings.json`: Read/Edit deny rules for `.env` variants at any depth.
- `.gitignore`: under `.claude/` only `settings.json`, `hooks/` and `agents/` can be committed.
- `lib/ai/usage.ts`: `logAiUsage(step, requestedModel, servedModel, usage|null, testimonyId)`; logs
  `requested_model`, `failed`; prices dated model IDs by prefix; fallback models priced.
- `app/api/coach/{route,draft/route,suggest/route}.ts`: a failed call that never reached the usage
  log is logged once from the catch block (tokens unknown).
- `lib/ai/usage.test.ts`: dated IDs, null cache counts, log line shape, failed-call line.
- Issues #10 and #29 (and `docs/issues.json` I-03, I-25): domain acceptance criteria.
- `docs/BETA_PLAN.md`, `docs/ROADMAP.md`: log-access note, domain rules, proposed beta-bar additions
  for the owner, "fit" wording replaced.
- Same guard and settings fixes applied to the `/project-setup` template for future projects.

## Decisions and alternatives
- The hook stays best effort; GitHub rulesets remain the real control (the agent account is not an
  admin). Fully parsing shell is out of scope.
- Failed calls are logged with unknown tokens rather than estimated, so cost data never invents numbers.
- Domain rules go into the Discovery design Issue as acceptance criteria; the choices that are the
  owner's (listing source, adults-only beta, pastoral review, wording) are listed, not decided.

## Assumptions and open questions
Owner decisions listed in docs/BETA_PLAN.md and #29 (D-06, wording, adults-only, pastoral review,
POLICY §2/§12 revision).

## Interfaces, data and configuration
Log line gains `requested_model` and `failed`. No schema, API or env changes.

## Verification
Lint, type-check and 15 unit tests pass; guard check 29/29; CI on this PR.

## Known limitations and follow-ups
Canopy's copy of the guard hook has the same gaps; update it from the template.

## Risks and rollback
Stricter hook could block a legitimate command; the message says why. Revert this PR to undo.

## Notes for future agents
After changing guard.mjs, run `node .claude/hooks/guard.check.mjs` and add a case for the new rule.

## Related
`docs/changelog/2026-10-27-pr-24-project-setup-guardrails.md`, `2026-10-27-pr-31-ai-cost-controls.md`,
`2026-10-27-pr-30-beta-plan.md`.
