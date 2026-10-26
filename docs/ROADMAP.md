# RebirthAI — Roadmap

High-level direction only. **The GitHub Project is the authoritative source** for detailed
tasks, sequencing, status and ownership: https://github.com/users/ghbrando/projects/2
Each item below links to its Issue; acceptance criteria and discussion live there, not here.
Phases and traceability: `docs/IMPLEMENTATION_PLAN.md`.

## Where we are

The MVP (SDD §2.2) is built on `main`. The current phase verifies it against every SDD
pass/fail check and prepares a governed release.

## Phases

**0–5 · MVP build — done (Oct 24, 2026)**
Foundation, account and profile, AI coach, editor and media, publish and public page,
contact card and share. Issues #2–#9 (closed, for traceability).

**6 · MVP completion and verification — current**
Goal: every SDD story verified with evidence or explicitly excepted by the owner.
1. Dashboard — #11
2. Installable PWA — #12
3. Resumable uploads — #13
4. Accessibility pass — #15
5. End-to-end smoke test — #14 (needs #18)
6. Coach fabrication review — #10 (needs a live AI key)
7. Device matrix — #16 (needs #18, #19)
8. Performance budget — #17 (needs #19)

**7 · Release readiness — in progress**
Goal: a governed, deployed MVP on its final domain.
Governed branches — #1 (done) · Supabase project — #18 · Vercel and final domain — #19 · AI cost controls — #20

Sequencing note: #18 unblocks most verification; #19 waits on the domain decision (D-04),
which must be made before any real contact card is shared.

## Later (not planned in detail; each needs an owner decision)

Recipient accounts and saved library (OQ-01) · multiple testimonies per profile (OQ-02) ·
other faiths or non-faith stories (OQ-03) · discovery and browsing (OQ-04) ·
longer video with transcoding (OQ-07) · moderation tooling (RISK-04) · native apps (DD-01).
