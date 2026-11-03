# Changelog

Notable changes for people using or reviewing RebirthAI, newest first.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versions: [Semantic Versioning](https://semver.org/).

How this file is maintained:
- Every PR into `dev` writes a change record in `docs/changelog/` and adds a line here under **Unreleased** linking to it.
- Promoting `dev` to `staging` turns **Unreleased** into a dated version (skill `release-candidate`).
- `main` receives the same entries when the owner promotes `staging` to `main`.

## [Unreleased]

### Changed
- Accessibility pass: visible focus rings, darker small text and input borders, labelled fields with announced errors, coach messages announced, skip link and page titles (#15, [record](docs/changelog/2026-11-02-pr-50-accessibility.md))
- Beta copy pass: removed "Screen N" labels, one link format (`/@handle`) everywhere, plain publish status sentences, Heading/Subheading editor toolbar, "Ask the AI for help", "Download contact card" (#35, [record](docs/changelog/2026-11-02-beta-copy-pass.md))

### Added
- Large videos upload in resumable pieces: a dropped connection pauses ("Paused, reconnecting…") and continues where it stopped instead of starting over; uploads can be cancelled (#52, closes #13, [record](docs/changelog/2026-11-02-pr-52-resumable-uploads.md))
- Installable app: web app manifest, theme color and home-screen icons; opens at the dashboard (#12, [record](docs/changelog/2026-11-02-pr-51-installable-app.md))
- Privacy policy and terms of use pages, linked from the home page, sign-in and every public testimony page; marked as a draft until the owner fills in the remaining details and has them reviewed (#49, [record](docs/changelog/2026-11-02-privacy-terms.md))
- A small "Send feedback" link on every signed-in screen for beta users, set by `NEXT_PUBLIC_FEEDBACK_URL` and hidden when unset (#48, advances #28, [record](docs/changelog/2026-11-02-pr-48-feedback-link.md))
- `npm run smoke`: a phone-sized browser test of the demo path (sign-in, every author screen, public page, contact card, QR) against a running local app (#47, advances #14, [record](docs/changelog/2026-11-02-pr-47-smoke-test.md))
- First-impression polish: readable font, menu that fits a phone, calmer coach header, clearer landing page, menu on Settings (#45, [record](docs/changelog/2026-11-02-pr-45-first-impression-polish.md))
- Publish screen: plain "who can see this" sentences, Unlisted by default (owner decision D-09), delete moved apart with a clear confirmation, and one consent sentence for contact details in settings and contact (#46, [record](docs/changelog/2026-11-02-publish-clarity.md))
- Contact cards and QR codes can no longer point at a test address in production; a missing or test site address now stops with a clear error (#42, [record](docs/changelog/2026-11-02-site-url-guard.md))
- The dashboard now explains when a page was taken down and offers only "Keep editing" (#44, follow-up to #39 and #41, [record](docs/changelog/2026-11-02-dashboard-takedown-notice.md))
- Reports now alert the operator's phone, and the operator can take a page down (and restore it) with one command; the author sees why and how to reach the operator, and cannot republish while it is down. Includes a database change (#41, [record](docs/changelog/2026-11-02-report-takedown.md))
- Delete my account: authors can permanently remove their profile, testimony, coach conversations, photos and videos; their link then shows "no longer available" and the handle is never reused (#40, [record](docs/changelog/2026-11-02-delete-account.md))
- A real dashboard that says in plain words where your testimony stands and offers one clear next step (#39, [record](docs/changelog/2026-11-02-dashboard.md))
- Local test environment with made-up people, so demos and reviews never use real accounts; fixes a sign-in loop in demo mode (#34, [record](docs/changelog/2026-11-01-local-test-env.md))
- Domain rules for Discovery and stronger coach truthfulness checks recorded from a ministry-focused review; AI cost logging counts failed calls (#32, [record](docs/changelog/2026-10-27-pr-32-review-findings.md))
- AI cost tracking per testimony and a per-step choice of coach model, so RebirthAI can stay free for users as it grows; the coach itself is unchanged (#31, [record](docs/changelog/2026-10-27-pr-31-ai-cost-controls.md))
- Private beta plan, with Discovery & Community (a feed of related testimonies, local Bible studies and churches) planned as the next phase; new Issues for privacy policy, account deletion, report handling and feedback (#30, [record](docs/changelog/2026-10-27-pr-30-beta-plan.md))
- Automatic checks (lint, type-check, unit tests) on every pull request, plus agent guardrails that block pushes to `staging`/`main` and reading secret files (#24, [record](docs/changelog/2026-10-27-pr-24-project-setup-guardrails.md))
- Change records: one context file per change in `docs/changelog/`, backfilled for all past changes (#23, [record](docs/changelog/2026-10-26-pr-23-change-records.md))
- Release changelog with links to the change records (#22, [record](docs/changelog/2026-10-26-pr-22-changelog.md))
- Implementation plan with phases, real status and SDD traceability (`docs/IMPLEMENTATION_PLAN.md`) (#21, [record](docs/changelog/2026-10-26-pr-21-lab3-planning.md))
- Persistent project context for agents: architecture rules, product policy and roadmap (`docs/ARCHITECTURE.md`, `docs/POLICY.md`, `docs/ROADMAP.md`) (#21, [record](docs/changelog/2026-10-26-pr-21-lab3-planning.md))
- Planned backlog of 20 Issues on the RebirthAI Project, generated from `docs/issues.json` and awaiting owner review (#1–#20, [record](docs/changelog/2026-10-26-pr-21-lab3-planning.md))
- Branch protection: work flows `feature/*` → `dev` → `staging` → `main`, and only the owner can approve promotions to `staging` and `main` (#1, [record](docs/changelog/2026-10-26-pr-21-lab3-planning.md))

### Security
- Agent guardrail closes bypasses found in review (wrapped commands, `git -C`, `gh api` merges); secret-file rules cover every folder (#32, [record](docs/changelog/2026-10-27-pr-32-review-findings.md))
- Documented that the one-click demo sign-in must never be enabled on a deployed site (ARCHITECTURE rule 5) (#21, [record](docs/changelog/2026-10-26-pr-21-lab3-planning.md))

## [0.1.0] - 2026-10-24

First working MVP, built in a hackathon sprint. Code-complete for SDD stories US-01–US-15; the
SDD's pass/fail checks are not yet verified (see Issues #10–#17).

### Added
- Local test environment with made-up people, so demos and reviews never use real accounts; fixes a sign-in loop in demo mode (#34, [record](docs/changelog/2026-11-01-local-test-env.md))
- Sign in with an email link or Google, and create a profile with a unique handle, photo and bio (#3, [record](docs/changelog/2026-10-24-auth-profile.md))
- Change your handle without breaking links: old links keep working forever (#3, [record](docs/changelog/2026-10-24-auth-profile.md))
- AI coach that interviews you one question at a time through life before, the turning point and life after, and picks up where you left off (#4, [record](docs/changelog/2026-10-24-ai-coach.md))
- Draft written only from your own answers, plus suggestions you accept or reject (#4, #5, [record](docs/changelog/2026-10-24-ai-coach.md))
- Crisis resources (988 Suicide & Crisis Lifeline) shown if you say you are in danger (#4, [record](docs/changelog/2026-10-24-ai-coach.md))
- Editor with autosave, and photos and short videos placed in your story with captions and alt text (#5, #6, [record](docs/changelog/2026-10-24-editor-media.md))
- Preview exactly what recipients see, then publish as Public or Unlisted; unpublish or delete any time (#7, [record](docs/changelog/2026-10-24-publish-public-page.md))
- Public testimony page at `/@handle` that needs no account, with link previews, tap-to-play video, a Report link and an optional Save contact button (#8, [record](docs/changelog/2026-10-24-publish-public-page.md))
- Contact card (.vcf) and QR code that carry your testimony link, with step-by-step iPhone and Android guides (#9, [record](docs/changelog/2026-10-24-contact-card-share.md))
- Share by copying the link or using your phone's share sheet (#9, [record](docs/changelog/2026-10-24-contact-card-share.md))
- One-click demo sign-in for local demos only (`DEMO_MODE=1`) ([record](docs/changelog/2026-10-24-integration-demo-mode.md))

### Security
- Every private page and action checks your sign-in on the server; the database only lets you see your own drafts and conversations (#2, [record](docs/changelog/2026-10-24-foundation.md))
- Location data is removed from uploaded photos; drafts and their media stay private until you publish (#6, [record](docs/changelog/2026-10-24-editor-media.md))
- Contact phone and email are shared only if you turn them on (#3, [record](docs/changelog/2026-10-24-auth-profile.md))

[Unreleased]: https://github.com/ghbrando/rebirthai/compare/main...dev
[0.1.0]: https://github.com/ghbrando/rebirthai/tree/46edba4
