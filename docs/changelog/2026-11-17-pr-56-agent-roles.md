---
pr: 56
issues: []
date: 2026-11-17
branch: docs/project-setup-agents
merge_commit: pending
author: Lead (agent)
ids: [RC-07]
areas: [.claude/agents, CLAUDE.md, .github/workflows/checks.yml, docs/changelog]
type: infra
status: open
---

# Agent roles in the repo, and setup gaps found by a fresh-session check

## Summary
The repo now carries every agent role it uses, so any machine or collaborator sees the same
Lead, specialists and handoffs. A fresh session with no history was asked to explain how it
would take a Ready Issue to merge; the gaps it found are fixed here in the configuration.

## Context
`/project-setup` stage 5 now copies the operating-model roles into `.claude/agents/`, and stage
5.5 verifies the configuration with a fresh session. Before this, only `domain-expert.md` was
in the repo.

## What changed
- `.claude/agents/`: added architect, critic-synthesizer, implementation-engineer,
  lead-chief-of-staff, product-owner, qa-verifier, security-privacy-reviewer and
  ux-language-advocate (project `domain-expert.md` kept). The security reviewer is adapted to
  this stack: Supabase RLS, storage policies and bucket limits, SECURITY DEFINER functions,
  service-role boundary (RC-07), and testimony/faith/contact data instead of generic data.
- `CLAUDE.md` Workflow: where roles live and what to do without the owner's user-level skills;
  the plan-file → change-record handoff; one owner for the local test environment and browsers.
- `.github/workflows/checks.yml`: runs `.claude/hooks/guard.check.mjs` so a weakened guard fails CI.
- `docs/changelog/README.md`: index completed for PRs #34–#55; record front matter for merged PRs
  now carries the real merge commit and `status: merged`.

## Decisions and alternatives
- Kept the existing record file names that lack `pr-N` (#39–#46, #49): renaming would break links
  in `CHANGELOG.md` and Issue comments for no reader benefit; new records follow the rule.
- Did not copy the Lead's skills into the repo: they are the owner's cross-project workflow and
  are synced between machines separately; CLAUDE.md states the fallback.
- Not enforced by hooks or CI (documented only): branch-name format, the Ready + Reviewed gate,
  one record per PR, and `DEMO_MODE` off in deployments. Enforcing them needs repository settings
  or deployment checks; revisit if they are skipped in practice.

## Assumptions and open questions
None.

## Interfaces, data and configuration
No app code, schema or env change. CI gains one fast step (no secrets).

## Verification
- Guard: a protected-branch push payload exits 2, a harmless command exits 0;
  `node .claude/hooks/guard.check.mjs` → all 29 cases correct.
- Fresh-session check (stage 5.5): answer pasted in the PR; gaps it listed are fixed or
  recorded above.

## Known limitations and follow-ups
`docs/RebirthAI_SDD.pdf` is an export of `docs/sdd/RebirthAI_SDD.html`; the HTML stays the source.

## Risks and rollback
Revert the commit. If the guard check step fails CI, the guard itself regressed: fix the guard,
not the step.

## Notes for future agents
Project copies in `.claude/agents/` win over user-level ones: change roles here, in a PR.

## Related
`2026-10-27-pr-24-project-setup-guardrails.md`.
