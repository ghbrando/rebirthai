# RebirthAI — Roadmap

High-level direction only. **The GitHub Project is the authoritative source** for detailed
tasks, sequencing, status and ownership: https://github.com/users/ghbrando/projects/2
Each item below links to its Issue; acceptance criteria and discussion live there, not here.
Phases and traceability: `docs/IMPLEMENTATION_PLAN.md`.

## Where we are

The MVP (SDD §2.2) is built. After the hackathon, a Google engineer asked the team to make it real,
so the goal is now a **private beta** with him and people he knows (`docs/BETA_PLAN.md`). Most code
work for that bar is merged to `dev`. What remains is hosting, the final domain, owner review and
verification on real services and devices.

## Phases

**0–5 · MVP build — done (Oct 24, 2026)**
Foundation, account and profile, AI coach, editor and media, publish and public page,
contact card and share. Issues #2–#9 (closed, for traceability).

**6 · MVP completion and verification — current**
Goal: every SDD story verified with evidence or explicitly excepted by the owner.
Done: dashboard #11 · installable app #12 · resumable uploads #13 · smoke test #14 · accessibility code audit #15.
Open: coach fabrication review #10 (needs a live AI key) · device matrix #16 (needs #18, #19) ·
performance budget #17 (needs #19).

**7 · Release readiness — in progress**
Goal: a governed, deployed MVP on its final domain that meets the beta bar.
Done: governed branches #1 · delete my account #26 · reports reach the operator #27 · feedback link #28 ·
copy pass #35 · publish screen #36 · contact card address guard #37 · first-impression polish #38.
Open: Supabase project #18 · Vercel and final domain #19 · AI spend limit #20 · owner review of the privacy
policy and terms #25 · video location data #53 · storage cap and cleanup #54.

Sequencing note: #18 unblocks most verification; #19 waits on the domain decision (D-04),
which must be made before any real contact card is shared.

**8 · Discovery & Community — next, after the beta**
Goal: after writing a testimony, browse others, get a "for you" feed of related testimonies, and
find local Bible studies and churches to explore. Opt-in only; designed with beta learnings.
Design first — #29 (decisions D-06, D-07).

## Later (not planned in detail; each needs an owner decision)

Recipient accounts and saved library (OQ-01) · multiple testimonies per profile (OQ-02) ·
other faiths or non-faith stories (OQ-03) · discovery and browsing (OQ-04) ·
longer video with transcoding (OQ-07) · moderation tooling (RISK-04) · native apps (DD-01).
