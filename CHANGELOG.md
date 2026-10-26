# Changelog

Notable changes for people using or reviewing RebirthAI, newest first.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versions: [Semantic Versioning](https://semver.org/).

How this file is maintained:
- Every feature PR into `dev` adds a line under **Unreleased** (what changed for a user, plus the Issue).
- Promoting `dev` to `staging` turns **Unreleased** into a dated version (skill `release-candidate`).
- `main` receives the same entries when the owner promotes `staging` to `main`.

## [Unreleased]

### Added
- Implementation plan with phases, real status and SDD traceability (`docs/IMPLEMENTATION_PLAN.md`) (#21)
- Persistent project context for agents: architecture rules, product policy and roadmap (`docs/ARCHITECTURE.md`, `docs/POLICY.md`, `docs/ROADMAP.md`) (#21)
- Planned backlog of 20 Issues on the RebirthAI Project, generated from `docs/issues.json` and awaiting owner review (#1–#20)
- Branch protection: work flows `feature/*` → `dev` → `staging` → `main`, and only the owner can approve promotions to `staging` and `main` (#1)

### Security
- Documented that the one-click demo sign-in must never be enabled on a deployed site (ARCHITECTURE rule 5) (#21)

## [0.1.0] - 2026-10-24

First working MVP, built in a hackathon sprint. Code-complete for SDD stories US-01–US-15; the
SDD's pass/fail checks are not yet verified (see Issues #10–#17).

### Added
- Sign in with an email link or Google, and create a profile with a unique handle, photo and bio (#3)
- Change your handle without breaking links: old links keep working forever (#3)
- AI coach that interviews you one question at a time through life before, the turning point and life after, and picks up where you left off (#4)
- Draft written only from your own answers, plus suggestions you accept or reject (#4, #5)
- Crisis resources (988 Suicide & Crisis Lifeline) shown if you say you are in danger (#4)
- Editor with autosave, and photos and short videos placed in your story with captions and alt text (#5, #6)
- Preview exactly what recipients see, then publish as Public or Unlisted; unpublish or delete any time (#7)
- Public testimony page at `/@handle` that needs no account, with link previews, tap-to-play video, a Report link and an optional Save contact button (#8)
- Contact card (.vcf) and QR code that carry your testimony link, with step-by-step iPhone and Android guides (#9)
- Share by copying the link or using your phone's share sheet (#9)
- One-click demo sign-in for local demos only (`DEMO_MODE=1`)

### Security
- Every private page and action checks your sign-in on the server; the database only lets you see your own drafts and conversations (#2)
- Location data is removed from uploaded photos; drafts and their media stay private until you publish (#6)
- Contact phone and email are shared only if you turn them on (#3)

[Unreleased]: https://github.com/ghbrando/rebirthai/compare/main...dev
[0.1.0]: https://github.com/ghbrando/rebirthai/tree/46edba4
