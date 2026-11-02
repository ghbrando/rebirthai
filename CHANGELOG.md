# Changelog

Notable changes for people using or reviewing RebirthAI, newest first.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versions: [Semantic Versioning](https://semver.org/).

How this file is maintained:
- Every PR into `dev` writes a change record in `docs/changelog/` and adds a line here under **Unreleased** linking to it.
- Promoting `dev` to `staging` turns **Unreleased** into a dated version (skill `release-candidate`).
- `main` receives the same entries when the owner promotes `staging` to `main`.

## [Unreleased]

### Added
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
