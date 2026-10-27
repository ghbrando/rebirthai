# RebirthAI

AI-guided testimony platform: a person writes their story with an AI coach, publishes it at a
permanent `/@handle` URL, and shares it through a contact card (vCard + QR).
Hackathon project: favor working demos over polish; keep the README current with how to run it.

## Run and test
- Run: `npm run dev` (needs `.env.local`, see README; `DEMO_MODE=1` enables `/demo` sign-in)
- Test: `npm test` (Vitest unit tests)
- Lint / types: `npm run lint`, `npm run typecheck`
Every change passes these before a PR; CI (`lint-typecheck-test`) runs them on every PR.

## Sources of truth
- Behavior and IDs (US-, RC-, DD-, OQ-): `docs/sdd/RebirthAI_SDD.html`
- Plan, phases and open decisions D-01–D-05: `docs/IMPLEMENTATION_PLAN.md`
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
- Active work: `docs/current_feature_plans/`.
- Change records: `docs/changelog/` (one per PR). Before changing an area, read the records
  that touched it (`grep -l "<path or ID>" docs/changelog/*.md`); every PR adds its own record.

## Stop and ask the owner
- Any open decision D-01–D-05 (notably D-04: the final domain is baked into every vCard and QR).
- Schema, RLS or storage-policy changes; anything exposing server-only keys (RC-07).
- AI behavior beyond coaching the author's own words (RC-04, DD-04); faith framing (POLICY §6).
- Destructive data operations, or a conflict between the SDD and the code.
