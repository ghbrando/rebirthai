# RebirthAI

AI-guided testimony platform: a person writes their story with an AI coach, publishes it at a
permanent `/@handle` URL, and shares it through a contact card (vCard + QR).
Started as a hackathon project; now heading to a private beta with real users (`docs/BETA_PLAN.md`).
Ship small and fast, but never cut corners on privacy, data, or the coach's truthfulness.
Keep the README current with how to run it.

## Run and test
- Run: `npm run dev` (needs `.env.local`, see README; `DEMO_MODE=1` enables `/demo` sign-in)
- Local test environment with fictional data (for reviews, screenshots, demos): README
  "Local test environment". Never point local work at a hosted project.
- Test: `npm test` (Vitest unit tests)
- Lint / types: `npm run lint`, `npm run typecheck`
Every change passes these before a PR; CI (`lint-typecheck-test`) runs them on every PR.

## Sources of truth
- Behavior and IDs (US-, RC-, DD-, OQ-): `docs/sdd/RebirthAI_SDD.html`
- Plan, phases and open decisions: `docs/IMPLEMENTATION_PLAN.md`
- Structure and rules to preserve: `docs/ARCHITECTURE.md`
- Domain, privacy and safety rules: `docs/POLICY.md`
- Direction: `docs/ROADMAP.md`
- Task work: the GitHub Issue you were given. Work only on Issues with Human Review = Reviewed
  and Status = Ready. The Issue's acceptance criteria define done.
- Next.js here has breaking changes: read `AGENTS.md` before writing Next.js code.

## Workflow
- Branches: `feature/<issue>-<slug>` from `dev` → PR into `dev`. Never push to or approve
  `staging` or `main`.
- Reference the Issue and design IDs in commits and the PR.
- Roles: `.claude/agents/` (the Lead routes; specialists report to it). The Lead's workflow
  skills (`feature-cycle`, `executive-question`, `executive-brief`) live in the owner's user
  config; without them, follow this file and the agent files.
- Active work: `docs/current_feature_plans/<issue>-<slug>.md`, written by the implementer; at PR
  time it becomes `docs/changelog/YYYY-MM-DD-pr-N-<slug>.md` and the plan file is deleted.
- Change records: `docs/changelog/` (one per PR, listed in its README index). Before changing an
  area, read the records that touched it (`grep -l "<path or ID>" docs/changelog/*.md`).
- Board fields (Status, Human Review, Phase, Sequence, Priority): GitHub Project 2,
  `gh project item-list 2 --owner ghbrando --format json`.
- The implementer opens the PR; the Lead merges it into `dev` once checks and QA pass, then sets
  the record's `status`/`merge_commit`, comments on and closes the Issue, and moves it to Done in Dev.
- Local test environment, dev server and browsers: only the Lead (or the one agent it names)
  starts them, one at a time, and stops them before reporting done.

## Stop and ask the owner
- Any open decision in the plan, Section 6.1 (notably D-04: the final domain is baked into every vCard and QR).
- Schema, RLS or storage-policy changes; anything exposing server-only keys (RC-07).
- AI behavior beyond coaching the author's own words (RC-04, DD-04); faith framing (POLICY §6).
- Destructive data operations, or a conflict between the SDD and the code.
