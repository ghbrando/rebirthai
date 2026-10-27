---
pr: 31
issues: [10, 20]
date: 2026-10-27
branch: feature/ai-cost-controls
merge_commit: pending
author: Lead agent, from owner direction
ids: [RC-08, RISK-05, RC-04, DD-04]
areas: [lib/ai/usage.ts, lib/ai/client.ts, app/api/coach, README.md, docs/BETA_PLAN.md]
type: feature
status: open
---

# AI cost controls: per-step coach models and cost logging

## Summary
RebirthAI stays free for its users (owner decision), so the operator pays for AI. Every coach call
now logs its token use and estimated cost per testimony, and each coach step can run on its own
Claude model through a setting. Behavior is unchanged: all steps still default to the top model
until the truthfulness check proves a cheaper one invents nothing.

## Context
The owner asked what happens at ~10k users. AI is the largest cost that grows with users. Options
reviewed with the owner: users paying with their own AI subscription (OpenAI's "Sign in with
ChatGPT" covers only paying ChatGPT users; Claude does not allow it) and on-phone models (too weak;
small models invent details, which breaks RC-04). Chosen: make the AI cheap and measured.

## What changed
- `lib/ai/usage.ts` (new): `coachModel(step)` returns the model for `interview`, `draft` or
  `suggest`, from `COACH_MODEL_INTERVIEW` / `_DRAFT` / `_SUGGEST`, accepting only known models
  (`claude-opus-5-5` default, `claude-sonnet-5-5`, `claude-haiku-5-5`); `estimateCostUsd` from list
  prices; `logAiUsage` prints one JSON line (`event: "ai_usage"`, step, model, testimony_id, token
  counts, est_usd).
- `app/api/coach/route.ts`, `draft/route.ts`, `suggest/route.ts`: use `coachModel(step)` and call
  `logAiUsage` with the model that actually served the request (fallbacks can change it).
- `lib/ai/client.ts`: `COACH_MODEL` constant removed (replaced by `coachModel`).
- `lib/ai/usage.test.ts`: model selection and cost math.
- `README.md`: the three optional settings. `docs/BETA_PLAN.md`: "Free for users; AI cost stays low".
- Issues #10 (also compare Sonnet 5.5 and Haiku 5.5 for the interview) and #20 (measure cost per
  testimony) updated, with `docs/issues.json` kept in sync.

## Decisions and alternatives
- **Default unchanged.** Switching models changes coach quality; the evidence comes from #10, and
  the owner decides. Unknown model names fall back to the default rather than failing.
- **Logs, not a database table.** No schema change, no new access rules, no stored content; enough to
  compute cost per testimony in the beta. A table can come later if dashboards are needed.
- **No in-code global budget.** The Console monthly limit is the hard cap (#20); a code-side budget
  would need shared storage.

## Assumptions and open questions
- Prices are cached list prices (2026-10-06); the Console bill is authoritative.
- `testimony_id` in logs is an internal identifier, not personal content.

## Interfaces, data and configuration
New optional env vars: `COACH_MODEL_INTERVIEW`, `COACH_MODEL_DRAFT`, `COACH_MODEL_SUGGEST`.
No schema or API shape changes.

## Verification
Lint, type-check and unit tests pass locally (12 tests, 5 new) and in CI. No live AI call was made.

## Known limitations and follow-ups
- #10 decides whether to set a cheaper interview model; #20 records the measured cost.
- Fallback-served models outside the price table log `est_usd: null`.

## Risks and rollback
Logging only adds a line per AI call. Revert the PR to restore the single constant.

## Notes for future agents
- Never log prompts, answers or names in `ai_usage` lines; testimonies are sensitive.
- To add a model: add it to `PRICES` in `lib/ai/usage.ts` (that also allow-lists it).

## Related
`docs/BETA_PLAN.md`, `docs/changelog/2026-10-27-pr-30-beta-plan.md`.
