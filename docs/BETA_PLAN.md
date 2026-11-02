# RebirthAI — Private Beta Plan

RebirthAI started as a hackathon project. A Google engineer asked the team to make it real: he
would use it and knows people who would. This plan moves it from demo to a small private beta.
Detailed tasks live in the GitHub Project; this file holds the goal, the bar and the order.

## Goal
A private beta: the design partner (the Google engineer) and roughly 10–20 people he knows write,
publish and share real testimonies. Success = they share stories in real conversations, and we
learn what they would want next (especially for Discovery, below).

## Bar for inviting anyone (must be true)
| Need | Why | Issue |
|---|---|---|
| Final domain decided (D-04) | Baked into every contact card and QR; permanent once shared | #19 |
| Hosting accounts decided (D-03), app live on them | Nothing real without it | #18, #19 |
| AI spend cap and rate limit | A busy week must not create a surprise bill | #20 |
| Coach invents nothing | One made-up quote or verse breaks trust in a faith story | #10 |
| Works on real iPhones and Androids; demo path smoke-tested | Shared in person, on phones | #16, #14 |
| Privacy policy and terms | Users share deeply personal stories | #25 |
| Delete my account and all my data | Users must be able to take their story back | #26 |
| Reports reach a person who can take a page down | Public pages can be abused (RISK-04) | #27 |
| Demo sign-in off on the live site | ARCHITECTURE rule 5 | #19 |

Proposed additions from the domain review (owner to confirm): adults-only invitees; a pastor
(e.g. the design partner's church leader) reads the coach prompts and faith framing; a plain
"what RebirthAI does not do" statement (no counseling, no ministry endorsement); a clear "who sees
this" explanation on the publish screen; a contact path for someone distressed after publishing.

Good before beta, not blocking: dashboard #11, accessibility #15, installable app #12,
performance #17, large video uploads #13, in-app feedback link #28.

## Free for users; AI cost stays low
Owner decision (2026-10-27): RebirthAI is free for the people using it. The operator pays for
hosting and AI, so cost per testimony must stay low as it grows (target scale: ~10k users).
- **Measure:** every coach call logs its token use and estimated cost (`event: "ai_usage"` in the
  server logs, by testimony). The beta gives the real cost per testimony.
- **Cheaper models where quality holds:** each coach step (interview, draft, edit suggestions) can
  run on its own model via settings. Default stays on the top model until the truthfulness check
  (#10) shows a cheaper one invents nothing. The interview is the likeliest saving; the draft,
  where quality matters most, likely stays on the top model.
- **Logs:** the cost lines carry token counts and a testimony ID, never story text or names. The ID
  can be linked to a person through the database, so hosting-log access stays with the owner and
  log retention is kept short (set with #19).
- **Hard cap:** a monthly spending limit in the Anthropic Console (#20) on top of the existing
  per-author hourly message limit.
- **Not pursued:** users paying with their own AI subscription (most users won't have one; Claude
  doesn't allow it) and on-phone models (too weak, and small models invent details).

## Owner decisions, in order
1. **Team and ownership (D-08)** (outside the code): who from the hackathon team continues and who owns the project.
2. **Design-partner conversation**: who he would invite, and what would make him trust it with his own story.
3. **D-04 final domain**, then **D-03 hosting accounts**.
4. **D-02** confirm MVP assumptions (one testimony, faith framing, indexing, video limits).

## Next phase: Discovery & Community (after the beta)
Owner direction (2026-10-27): after writing a testimony, a person can browse other testimonies,
get a "for you" feed of testimonies related to their own, and find local Bible studies and
churches to explore, based on their testimony.

Principles agreed now, before any design:
- **Opt-in only.** Appearing in the feed or in matching is a separate, explicit choice. Unlisted
  testimonies never appear. Existing testimonies are never added automatically.
- **Sensitive data.** Faith, and often health, addiction or abuse details, plus location. Needs a
  privacy and security review before build.
- **Suggest, don't judge.** The app explains why a study or church might be worth a visit; it never decides
  whether a person "fits". Domain rules for denominations and doctrine come from the domain expert.
- **Domain rules (domain review, 2026-10-27; detailed in #29):** sensitive disclosures never feed
  matching or feed excerpts; adults only; self-listed, accountable churches and groups showing
  their own tradition, never endorsed; doctrine-neutral; nothing pushed to people in crisis; no
  likes, counts or ranking; wording avoids "fit", "match" and "belong" (e.g. "Places to explore").
- **Built with beta learnings.** A feed needs content; the beta builds both content and insight.

Open decisions (in the plan): where church and Bible-study listings come from, churches listing
themselves vs. public map data (D-06); the feed consent model (D-07); and whether readers need
accounts (OQ-01, part of D-05). Design work: #29 (SDD v0.2 section).
