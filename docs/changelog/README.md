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
| 2026-11-04 | #55 | [Plan and roadmap now match the work merged since October](2026-11-04-plan-refresh.md) | #53, #54 |
| 2026-11-02 | #52 | [Resumable uploads for large videos](2026-11-02-pr-52-resumable-uploads.md) | #13 |
| 2026-11-02 | #51 | [Installable app: manifest and icons](2026-11-02-pr-51-installable-app.md) | #12 |
| 2026-11-02 | #50 | [Accessibility pass (WCAG 2.1 AA code audit)](2026-11-02-pr-50-accessibility.md) | #15 |
| 2026-11-02 | #49 | [Privacy policy and terms of use (draft)](2026-11-02-privacy-terms.md) | #25 |
| 2026-11-02 | #48 | [Send feedback link for beta users](2026-11-02-pr-48-feedback-link.md) | #28 |
| 2026-11-02 | #47 | [Smoke test of the full demo path](2026-11-02-pr-47-smoke-test.md) | #14 |
| 2026-11-02 | #46 | [Publish screen: clear "who can see this", safe delete, plain contact consent](2026-11-02-publish-clarity.md) | #36 |
| 2026-11-02 | #45 | [First-impression polish: readable type, phone-width menu, calmer coach header](2026-11-02-pr-45-first-impression-polish.md) | #38 |
| 2026-11-02 | #44 | [Dashboard explains when a page was taken down](2026-11-02-dashboard-takedown-notice.md) | #11, #27 |
| 2026-11-02 | #43 | [Beta copy pass: plain words and one link format](2026-11-02-beta-copy-pass.md) | #35 |
| 2026-11-02 | #42 | [Contact cards never point at a test address](2026-11-02-site-url-guard.md) | #37 |
| 2026-11-02 | #41 | [Reports reach the operator, who can take a page down](2026-11-02-report-takedown.md) | #27 |
| 2026-11-02 | #40 | [Delete my account and all my data](2026-11-02-delete-account.md) | #26 |
| 2026-11-02 | #39 | [Dashboard: where your testimony stands and what to do next](2026-11-02-dashboard.md) | #11 |
| 2026-11-01 | #34 | [Local test environment with fictional data, and a demo sign-in loop fix](2026-11-01-local-test-env.md) | — |
| 2026-10-27 | #32 | [Fixes from the specialist review](2026-10-27-pr-32-review-findings.md) | #10, #29 |
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
