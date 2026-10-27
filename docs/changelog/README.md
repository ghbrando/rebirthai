# Change records

One file per pull request, written by the agent (or person) who made the change, inside that PR.
Each record holds everything a future agent needs about the change: context, what changed,
decisions and rejected alternatives, assumptions, interfaces, verification, limitations, risks,
and notes for whoever touches this area next. Template: `_TEMPLATE.md`.

**Before changing an area, read the records that touched it:**
`grep -l "<path or ID>" docs/changelog/*.md` (front matter lists `areas` and `ids`).

File name: `YYYY-MM-DD-pr-<number>-<slug>.md` (changes merged without a PR: `YYYY-MM-DD-<slug>.md`). Demo GIFs and screenshots: `assets/<file name without .md>/`.
Release summaries live in `CHANGELOG.md` and link here.

## Index (newest first)

| Date | PR | Change | Issues |
|---|---|---|---|
| 2026-10-27 | #31 | [AI cost controls: per-step models and cost logging](2026-10-27-pr-31-ai-cost-controls.md) | #10, #20 |
| 2026-10-27 | #30 | [Private beta plan and Discovery direction](2026-10-27-pr-30-beta-plan.md) | #25–#29 |
| 2026-10-27 | #24 | [Guardrails, PR checks, project instructions](2026-10-27-pr-24-project-setup-guardrails.md) | — |
| 2026-10-26 | #23 | [Change records folder and backfill](2026-10-26-pr-23-change-records.md) | — |
| 2026-10-26 | #22 | [Release changelog (CHANGELOG.md)](2026-10-26-pr-22-changelog.md) | — |
| 2026-10-26 | #21 | [Implementation plan, backlog, persistent context](2026-10-26-pr-21-lab3-planning.md) | #1–#20 |
| 2026-10-24 | — | [Integration and demo sign-in](2026-10-24-integration-demo-mode.md) | — |
| 2026-10-24 | — | [Contact card, QR and sharing](2026-10-24-contact-card-share.md) | #9 |
| 2026-10-24 | — | [Preview, publish and public page](2026-10-24-publish-public-page.md) | #7, #8 |
| 2026-10-24 | — | [Editor and media](2026-10-24-editor-media.md) | #5, #6 |
| 2026-10-24 | — | [AI coach](2026-10-24-ai-coach.md) | #4 |
| 2026-10-24 | — | [Sign-in and profile](2026-10-24-auth-profile.md) | #3 |
| 2026-10-24 | — | [Foundation](2026-10-24-foundation.md) | #2 |
