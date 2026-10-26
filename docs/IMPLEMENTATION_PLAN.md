# RebirthAI — Implementation Plan

| | |
|---|---|
| Project | RebirthAI — AI-guided testimony platform |
| Repository | https://github.com/ghbrando/rebirthai |
| Source design | `docs/sdd/RebirthAI_SDD.html` (SDD v0.1, text source of `docs/RebirthAI_SDD.pdf`) |
| Plan version | v1.0 — October 26, 2026 |
| Author / owner | Brandon Magana |

---

## 1. Implementation Overview

### 1.1 Objective

Deliver the RebirthAI MVP defined in SDD §2.2: an author builds a testimony with an AI coach,
adds photos and video, publishes it at a permanent `/@handle` URL, and puts that URL on their
contact card (vCard + QR) so a recipient can open it from their phone's Contacts with no account.

This plan is written against the **actual state of the repository**. A first MVP build was
produced in a hackathon sprint on October 24, 2026 (phases 0–5 below, merged to `main`). This
plan therefore does three things:

1. Records the completed phases with their evidence (commits), so every SDD story stays traceable.
2. Identifies what is incomplete, deferred, or unverified against the SDD's pass/fail checks.
3. Turns the remaining work into ordered, agent-ready GitHub Issues (phases 6–7).

Status vocabulary used throughout:

| Status | Meaning |
|---|---|
| **Done** | Implemented and merged to `main`; code-level evidence exists. |
| **Done — verification pending** | Implemented, but the SDD's pass/fail check (devices, timing, review) has not been run. |
| **Partial** | Part of the requirement is implemented; the gap is named. |
| **Not started** | No implementation yet. |

### 1.2 Source Design Artifacts

| Artifact | Location | Used for |
|---|---|---|
| Software Design Document (SDD) v0.1 | `docs/sdd/RebirthAI_SDD.html`, `docs/RebirthAI_SDD.pdf` | Stories US-01–US-15, constraints RC-01–RC-14, decisions DD-01–DD-08, open questions OQ-01–OQ-07, risks RISK-01–RISK-06 |
| Screen flow (SDD §6.1, Figure 2) | SDD | Screens 1–14; the UI/UX reference for every phase |
| Design refinements (SDD §6.3) | SDD | Coach one-question flow, accept/reject suggestions, contact step after publish, QR encodes full vCard, public page layout, preview reminder |
| Architecture & data model (SDD §5.1–5.3, Figure 1) | SDD | Route handlers, Supabase tables, storage buckets |
| MVP build prompt | `docs/BUILD_PROMPT.md` | How phases 0–5 were executed (agent ownership by path) |
| Interactive UI/UX prototype | **Not yet produced** (SDD §6.2: "Prototype link: TBD") | Gap — see Section 6, D-01 |

### 1.3 Planning Assumptions & Scope Guardrails

**Assumptions** (from the SDD; each should be confirmed by the owner — see Section 6):

- A-01 — One testimony per profile in the MVP (DD-08).
- A-02 — Christian testimony framing, with the coach asking about scripture/faith only if the author wants (OQ-03).
- A-03 — Public pages are indexable, Unlisted pages are `noindex`, and there is no in-app browsing (OQ-04).
- A-04 — Domain shown as `rebirthai.app` is a placeholder until OQ-06 is decided.
- A-05 — Video is limited to 100 MB / about 3 minutes with no transcoding (OQ-07).

**Scope guardrails** (SDD §2.3 — never planned or built in this plan):

- No native apps and no writing to the phone's Contacts database (DD-01, DD-03).
- No social layer: feed, follows, comments, likes, messaging.
- No recipient accounts or saved libraries (OQ-01).
- No AI-generated images, video, voice, narration, or "write it for me" testimonies (RC-04, DD-04).
- No pastoral, theological, or crisis counseling by the AI beyond showing crisis resources (RC-05).
- No video transcoding, translation, org accounts, analytics, payments.

---

## 2. Phase Summary

Each phase produces a coherent, demonstrable increment.

| Phase | Name | Demonstrable increment | SDD scope | Status |
|---|---|---|---|---|---|
| 0 | Foundation | App boots; schema with RLS; screens 1–14 routed; `/@handle` rewrite | RC-01, RC-02, RC-07, DD-06 | Done |
| 1 | Account & Profile | Sign in, create profile with unique handle, change handle with redirect | US-01, US-02; RC-01, RC-03, RC-12; screens 2, 3, 11 | Done — verification pending |
| 2 | AI Coach & Draft | Guided streaming interview, resume, draft from the author's answers only | US-03, US-04, US-05; RC-04, RC-05, RC-08; DD-04, DD-07; screen 5 | Done — verification pending |
| 3 | Editor & Media | Edit with autosave, accept/reject AI suggestions, inline photo/video | US-06, US-07; RC-06, RC-09, RC-11; screen 6 | Partial (RC-09 resumable uploads deferred) |
| 4 | Publish & Public Page | Preview, publish/unpublish/delete, public `/@handle` page, report, link preview | US-08, US-12–US-15; RC-03, RC-06, RC-11, RC-13; DD-02, DD-05; screens 7, 8, 13, 14 | Done — verification pending |
| 5 | Contact Card & Share | vCard 3.0 download, QR, add-to-contact guide, copy link/share sheet | US-09, US-10, US-11; RC-10, RC-12; DD-03; screens 9, 10, 12 | Done — verification pending |
| 6 | MVP Completion & Verification | Dashboard, PWA, resumable uploads, automated E2E, every SDD pass/fail check run | Gaps in US-03–US-13; RC-09, RC-11, RC-14; screen 4 | Not started |
| 7 | Release Readiness | Governed branches, real Supabase + Vercel environments, domain, cost controls | RC-07, RC-08, OQ-06; Lab 2 trust model | In progress (governed branches done; rest needs human decisions) |

---

## 3. Detailed Implementation Phases

### Phase 0 — Foundation (Done)

- **Goal:** the contract every later phase builds against.
- **SDD references:** §5.1–5.3, RC-01, RC-02, RC-07, DD-06.
- **Deliverables:** Next.js App Router + TypeScript + Tailwind + shadcn/ui; Supabase server/client helpers and `requireUser()`; migration `supabase/migrations/0001_init.sql` creating `profiles`, `testimonies`, `coach_messages`, `media`, `handle_redirects`, `reports` with RLS and the `media-private` / `media-public` buckets; shared types in `lib/types.ts`; routing skeleton for screens 1–14; `/@handle` → `/u/[handle]` rewrite; `.env.example`.
- **Acceptance criteria:** `npm run typecheck` and `npm run build` pass; RLS is enabled on every table; no secret is referenced from client code.
- **Dependencies:** none.
- **UI/UX artifacts:** screen flow (SDD Figure 2).
- **Evidence:** merged to `main` on Oct 24, 2026.
- **Candidate Issues:** I-01.

### Phase 1 — Account & Profile (Done — verification pending)

- **Goal:** an author can sign in and own a profile at a unique handle.
- **SDD references:** US-01, US-02, RC-01, RC-03, RC-12; screens 2, 3, 11.
- **Deliverables:** email magic link + Google sign-in (`components/profile/sign-in-form.tsx`), redirect guards, onboarding with handle validation `[a-z0-9_]{3,30}` and uniqueness, photo upload, settings with opt-in phone/email and `share_contact`, handle change that writes `handle_redirects`.
- **Acceptance criteria:** US-01 and US-02 pass/fail checks; a changed handle redirects permanently and is never reassigned (RC-03); contact fields are off by default (RC-12).
- **Dependencies:** Phase 0.
- **UI/UX artifacts:** screens 2 Sign In, 3 Profile Setup, 11 Settings.
- **Evidence:** merge of `feat/auth-profile`.
- **Gap:** never exercised against a live Supabase project (no `.env.local`); Google provider not configured.
- **Candidate Issues:** I-02.

### Phase 2 — AI Coach & Draft (Done — verification pending)

- **Goal:** a guided interview that produces a draft built only from the author's answers.
- **SDD references:** US-03, US-04, US-05, RC-04, RC-05, RC-08, DD-04, DD-07; screen 5.
- **Deliverables:** streaming `/api/coach` with session check, history load/persist, one-question-per-turn system prompt (before / turning point / after), crisis handling with 988 resources, prompt caching, 60 messages/hour rate limit; `/api/coach/draft` (writes `draft_content`); `/api/coach/suggest` (returns proposed edits, never writes); `scripts/coach-eval.ts`.
- **Acceptance criteria:** US-03, US-04, US-05 pass/fail checks, including **zero invented details across five reviewed test sessions**; first streamed words within about 2 s.
- **Dependencies:** Phases 0–1.
- **UI/UX artifacts:** screen 5 AI Coach.
- **Evidence:** commits tagged US-03, US-04, US-05, RC-04, RC-05, RC-08, DD-07; merge of `feat/ai-coach`.
- **Gap:** the five-session fabrication review (US-05) and the 2-second streaming check have not been run.
- **Candidate Issues:** I-03, I-04.

### Phase 3 — Editor & Media (Partial)

- **Goal:** the author edits the draft and places photos and video inline.
- **SDD references:** US-06, US-07, RC-06, RC-09, RC-11; screen 6.
- **Deliverables:** TipTap editor bound to `draft_content` with autosave; accept/reject UI for coach suggestions; image/video blocks with caption and required alt text; type and size allow-lists; EXIF/GPS stripping (`lib/media/strip-exif.ts`); signed direct uploads to `media-private`.
- **Acceptance criteria:** US-06 and US-07 pass/fail checks; the AI never overwrites author text; uploads show progress and reject oversized/unsupported files with a clear message.
- **Dependencies:** Phases 0–2.
- **UI/UX artifacts:** screen 6 Editor.
- **Evidence:** merge of `feat/editor-media`.
- **Gap:** uploads are a single-shot XHR PUT with progress; **true resumable uploads (RC-09) were deferred** (noted in `lib/media/client.ts`). Display on iOS Safari / Android Chrome not verified.
- **Candidate Issues:** I-05, I-06.

### Phase 4 — Publish & Public Page (Done — verification pending)

- **Goal:** the author publishes and a signed-out recipient can read the story at a permanent URL.
- **SDD references:** US-08, US-12, US-13, US-14, US-15, RC-03, RC-06, RC-11, RC-13, DD-02, DD-05; screens 7, 8, 13, 14.
- **Deliverables:** preview using the public renderer with the "named other people" reminder (RISK-03); publish (draft → published snapshot, media to public bucket); unpublish; delete (rows + storage); server-rendered `/u/[handle]` with handle-redirect lookup, not-found/unavailable states, `noindex` for Unlisted; OG metadata and `@vercel/og` image; tap-to-play video; Report link; "Save contact" when `share_contact` is on.
- **Acceptance criteria:** US-08, US-12–US-15 pass/fail checks, including text content loading within **2.5 s on a mid-range phone over 4G** (US-13).
- **Dependencies:** Phases 0–3.
- **UI/UX artifacts:** screens 7 Preview, 8 Publish, 13 Testimony Page, 14 Save Contact.
- **Evidence:** commits tagged US-08, US-12, US-14, US-15, RC-03, RC-06, RC-11, RC-13; merge of `feat/publish-public`.
- **Gap:** performance budget and device behavior not measured.
- **Candidate Issues:** I-07, I-08.

### Phase 5 — Contact Card & Share (Done — verification pending)

- **Goal:** the testimony travels on the author's contact card.
- **SDD references:** US-09, US-10, US-11, RC-10, RC-12, DD-03; screens 9, 10, 12.
- **Deliverables:** vCard 3.0 builder (FN, N, TEL, EMAIL, URL, NOTE; UTF-8; escaping; line folding) with unit tests (`lib/vcard/build.test.ts`); `/api/vcard/[handle]` serving `text/vcard` as `.vcf`; QR encoding the full vCard text; "Add to my contact info" screen with iPhone and Android guides right after publish; share screen with QR, copy link, Web Share API.
- **Acceptance criteria:** US-09, US-10, US-11 pass/fail checks on a real iPhone and Android phone.
- **Dependencies:** Phases 0–4.
- **UI/UX artifacts:** screens 9 Add to My Contact Info, 10 Share, 12 Camera/Contacts.
- **Evidence:** commit tagged US-09, US-10, US-11, RC-03, RC-12; merge of `feat/contact-share`.
- **Gap:** device import and QR scanning not tested; link-preview rendering in iMessage/WhatsApp not tested.
- **Candidate Issues:** I-09.

### Phase 6 — MVP Completion & Verification (Not started)

- **Goal:** close every functional gap and run every SDD pass/fail check, with evidence.
- **SDD references:** screen 4; RC-09, RC-11, RC-14; pass/fail checks of US-03, US-05, US-07, US-09, US-10, US-11, US-13.
- **Deliverables:** Dashboard (screen 4) replacing the placeholder; PWA manifest and icons (RC-14); resumable uploads (RC-09); a Playwright smoke test of the full demo path; the five-session coach fabrication review; an iOS/Android device test matrix; a performance and accessibility check of the public page.
- **Phase acceptance criteria:** every SDD story is either verified with recorded evidence or has an explicit, owner-approved exception; `npm run typecheck`, `lint`, `build`, `test` and the E2E smoke test all pass.
- **Dependencies:** Phases 0–5. I-12 (E2E) and the device/perf checks need a working Supabase environment (I-17).
- **UI/UX artifacts:** screen 4 Dashboard; SDD §6.3 refinements; prototype (if produced, D-01).
- **Candidate Issues:** I-10 – I-16.

### Phase 7 — Release Readiness (In progress — governed branches done; rest needs human decisions)

- **Goal:** a governed, deployable MVP.
- **SDD references:** RC-07, RC-08, OQ-06; Lab 2 least-privilege and promotion-gate model.
- **Deliverables:** `dev` and `staging` branches with rulesets (agent may merge only into `dev`; `staging`/`main` human-only); a real Supabase project with the migration applied and auth providers configured; Vercel project with server-only secrets; final domain; Anthropic monthly spend limit.
- **Phase acceptance criteria:** a signed-out phone opens a published testimony on the deployed domain; no secret is in the repo or client bundle; branch rules block agent promotion to `staging`/`main`.
- **Dependencies:** owner decisions D-02, D-03, D-04; I-17 before Phase 6's environment-dependent checks.
- **UI/UX artifacts:** none.
- **Candidate Issues:** I-17 – I-20.

---

## 4. Cross-Phase Dependencies

| Dependency | Why it matters | Affects |
|---|---|---|
| Migration `0001_init.sql` + `lib/types.ts` | Every feature reads these tables and types; schema changes go through one owner | All phases |
| RLS policies (RC-02) | Privacy is enforced in the database, not the UI | Phases 1–5, I-12 |
| Permanent URL + `handle_redirects` (RC-03, DD-02) | URLs saved in contacts can never change | Phases 1, 4, 5; D-04 |
| Shared testimony renderer | Preview must match the public page (US-08) | Phases 3, 4 |
| Suggestion JSON shape (`lib/types.ts`) | Coach suggestions and editor accept/reject must agree | Phases 2, 3 |
| Live Supabase environment (I-17) | E2E, device, and performance checks need real auth, data and storage | I-12, I-14, I-15 |
| Final domain (D-04) | The URL is baked into every vCard and QR code | I-14, I-19 |

### 4.1 Implementation Sequence

1. Phases 0–5 — done (built in parallel on Oct 24, 2026, integrated on `main`).
2. **I-17 first** (I-18 governed branches is done), because most verification needs them and Lab 2's trust boundary must exist before agents work.
3. In parallel, no environment needed: **I-10** Dashboard, **I-11** PWA manifest, **I-13** resumable uploads, **I-16** accessibility pass (code review part).
4. Then, needing the environment: **I-12** E2E smoke test → **I-03** coach fabrication review → **I-14** device matrix → **I-15** performance check.
5. Last: **I-19** deploy + domain, **I-20** cost controls.

Parallel-safe groups: {I-10, I-11, I-13, I-16} touch separate paths. I-12 should land before the device matrix so regressions are caught automatically.

---

## 5. GitHub Issue Decomposition Guidance

Each Issue is one agent feature cycle: small enough to finish and verify in one run, large enough
to be a meaningful increment. Every Issue contains:

- **Context** — the user-facing outcome and why it matters.
- **Traceability** — SDD IDs (US/RC/DD/OQ/RISK), plan phase, and screen numbers.
- **Acceptance criteria** — observable, testable, in domain language (taken from the SDD pass/fail check where one exists).
- **Design references** — SDD sections, screen numbers, prototype frames when they exist.
- **Dependencies / constraints** — blocking Issues and constraints that must not be violated.
- **Verification** — the exact checks: commands, test files, device steps, or review procedure.
- **Out of scope** — what the agent must not do in this Issue.

Labels: `phase:0`–`phase:7`, `type:feature|verification|infra|docs`. Issues for completed phases
are created for traceability and closed with links to their merge commits.

### 5.1 Candidate Issue Inventory

| ID | GitHub | Title | Phase | SDD trace | Status |
|---|---|---|---|---|---|
| I-01 | [#2](https://github.com/ghbrando/rebirthai/issues/2) | Foundation: scaffold, Supabase clients, schema + RLS, routing skeleton | 0 | RC-01, RC-02, RC-07, DD-06 | Done (closed) |
| I-02 | [#3](https://github.com/ghbrando/rebirthai/issues/3) | Auth and profile: sign-in, onboarding, handle rules, settings, handle redirects | 1 | US-01, US-02, RC-03, RC-12 | Done (closed) |
| I-03 | [#10](https://github.com/ghbrando/rebirthai/issues/10) | Coach fabrication review: five test sessions, zero invented details | 2 / 6 | US-05, RC-04, RISK-02 | Backlog — awaiting review |
| I-04 | [#4](https://github.com/ghbrando/rebirthai/issues/4) | AI coach: streaming interview, resume, draft and suggestion endpoints | 2 | US-03, US-04, US-05, RC-04, RC-05, RC-08 | Done (closed) |
| I-05 | [#5](https://github.com/ghbrando/rebirthai/issues/5) | Editor: autosave and accept/reject AI suggestions | 3 | US-06, RC-04 | Done (closed) |
| I-06 | [#6](https://github.com/ghbrando/rebirthai/issues/6) | Media: allow-listed uploads, EXIF strip, inline blocks with alt text | 3 | US-07, RC-06, RC-09, RC-11 | Done (closed; resumable split to I-13) |
| I-07 | [#7](https://github.com/ghbrando/rebirthai/issues/7) | Preview, publish, unpublish and delete | 4 | US-08, US-12, DD-05, RISK-03 | Done (closed) |
| I-08 | [#8](https://github.com/ghbrando/rebirthai/issues/8) | Public `/@handle` page: redirects, noindex, OG preview, report, save contact | 4 | US-13, US-14, US-15, RC-03, RC-06, RC-13 | Done (closed) |
| I-09 | [#9](https://github.com/ghbrando/rebirthai/issues/9) | vCard 3.0, QR code, add-to-contact guide, share screen | 5 | US-09, US-10, US-11, RC-10, RC-12 | Done (closed) |
| I-10 | [#11](https://github.com/ghbrando/rebirthai/issues/11) | Dashboard (screen 4): testimony status and continue actions | 6 | Screen 4, SDD §6.1 | Backlog — awaiting review |
| I-11 | [#12](https://github.com/ghbrando/rebirthai/issues/12) | Installable PWA: manifest and icons | 6 | RC-14, DD-01 | Backlog — awaiting review |
| I-12 | [#14](https://github.com/ghbrando/rebirthai/issues/14) | Playwright smoke test of the full demo path | 6 | US-01–US-13 (demo path) | Backlog — blocked by I-17 |
| I-13 | [#13](https://github.com/ghbrando/rebirthai/issues/13) | Resumable media uploads for large videos | 6 | RC-09, RISK-06, US-07 | Backlog — awaiting review |
| I-14 | [#16](https://github.com/ghbrando/rebirthai/issues/16) | Device verification matrix: iPhone + Android | 6 | US-07, US-09, US-10, US-11, US-13, OQ-05 | Backlog — blocked by I-17, I-19 |
| I-15 | [#17](https://github.com/ghbrando/rebirthai/issues/17) | Public page performance budget: text in ≤2.5 s on 4G | 6 | US-13, RC-11 | Backlog — blocked by I-19 |
| I-16 | [#15](https://github.com/ghbrando/rebirthai/issues/15) | Accessibility pass: WCAG 2.1 AA contrast, keyboard, alt text, video controls | 6 | RC-11 | Backlog — awaiting review |
| I-17 | [#18](https://github.com/ghbrando/rebirthai/issues/18) | Supabase project: apply migration, configure magic link + Google, env vars | 7 | RC-01, RC-02, RC-07 | Backlog — awaiting review (human action) |
| I-18 | [#1](https://github.com/ghbrando/rebirthai/issues/1) | Governed branches: `dev` / `staging`, rulesets for the agent account | 7 | Lab 2 trust model | Done (closed, Oct 26 2026) |
| I-19 | [#19](https://github.com/ghbrando/rebirthai/issues/19) | Vercel deploy and final domain | 7 | RC-07, OQ-06, DD-02 | Backlog — blocked by D-04 |
| I-20 | [#20](https://github.com/ghbrando/rebirthai/issues/20) | AI cost controls: Anthropic spend limit and rate-limit check | 7 | RC-08, RISK-05 | Backlog — awaiting review (human action) |

---

## 6. Risks, Open Decisions & Agent Guardrails

### 6.1 Open decisions (owner must decide — agents must not guess)

| ID | Decision | Default until decided | Blocks |
|---|---|---|---|
| D-01 | Produce the interactive prototype for screens 1–14, or accept the SDD screen flow as the UI reference? | SDD Figure 2 + §6.3 are authoritative | Visual polish in I-10 |
| D-02 | Confirm assumptions A-01–A-05 (one testimony, faith framing, indexing, video limits) | Keep SDD MVP assumptions | Post-MVP scope |
| D-03 | Which Supabase and Vercel accounts/projects host the app? | — | I-17, I-19 |
| D-04 | Final domain and URL format (OQ-06) — permanent once vCards exist | `rebirthai.app` placeholder; do not publish real vCards | I-14, I-19 |
| D-05 | Recipient accounts (OQ-01), multiple testimonies (OQ-02), discovery (OQ-04) | Out of MVP scope | Post-MVP |

### 6.2 Risks

| ID | Risk | Mitigation in this plan |
|---|---|---|
| RISK-01 | Authors skip adding the link to their own card | Guide on screen 9 verified on devices (I-14); QR path works regardless |
| RISK-02 | AI invents details or flattens voice | Fabrication review (I-03); suggestions are accept/reject only |
| RISK-03 | Oversharing / naming third parties | Preview reminder (done), Unlisted visibility, one-click unpublish/delete |
| RISK-04 | Abuse of public pages | Authenticated uploads, allow-lists, Report link; moderation post-MVP |
| RISK-05 | AI cost spikes | Rate limit (done), prompt caching (done), spend limit (I-20) |
| RISK-06 | Large uploads fail on mobile networks | Resumable uploads (I-13) |
| RISK-07 | MVP was built faster than it was verified | Phase 6 runs every SDD pass/fail check before release |
| RISK-08 | Domain baked into contact cards before it is final | No real vCards distributed until D-04 |
| RISK-09 | `/demo` signs anyone in as the demo account (service-role key, no email step) when `DEMO_MODE=1` | Never set `DEMO_MODE` in a deployed environment (ARCHITECTURE.md rule 5); checked in I-19 |

### 6.3 Agent guardrails

Agents working any Issue in this plan must:

- Treat the SDD as the source of truth for behavior and IDs; reference IDs in commits and PRs.
- Never weaken RLS, move a privileged call to the client, or commit secrets (RC-01, RC-02, RC-07).
- Never let the AI write or overwrite author text without approval, or add details not in the author's answers (RC-04).
- Never change the permanent URL scheme or reassign handles (RC-03).
- Never enable `DEMO_MODE` outside a local machine, and never add a new service-role use without escalation.
- Never change the database schema or `lib/types.ts` silently: schema changes need a new migration and owner review.
- Stay within the Issue's scope; anything in SDD §2.3 is out of bounds.
- Merge only into `dev` after checks pass; never push to or approve `staging`/`main`.
- Stop and escalate on: any open decision D-01–D-05, security or privacy exposure, destructive data operations, or a conflict between the SDD and the code.

---

## 7. Handoff to GitHub Project

All Issues I-01–I-20 are added to the RebirthAI GitHub Project with these fields:

| Field | Values |
|---|---|
| Status | Backlog → Ready → In Progress → Agent Review → Done in Dev → Staging Candidate → Released (Done phases: Released or Done) |
| Phase | 0 Foundation · 1 Account & Profile · 2 AI Coach · 3 Editor & Media · 4 Publish & Public Page · 5 Contact & Share · 6 MVP Completion · 7 Release Readiness |
| Human Review | **Pending** (every AI-created Issue starts here) → **Reviewed** (only after the owner personally verifies it) |
| Sequence | Number from Section 4.1; lowest eligible first |
| Priority | High / Medium / Low |

Issues are generated from `docs/issues.json` by the reusable script `~/.claude/skills/project-setup/github/issues.py`. Every AI-created Issue enters at **Status = Backlog** and **Human Review = Pending**; built work enters closed at **Done in Dev**. Moving an Issue to **Ready** is the owner's authorization, done only after personally reviewing it and setting **Human Review = Reviewed**.

Rule: an agent may start an Issue only when **Human Review = Reviewed** and **Status = Ready**.

Project: https://github.com/users/ghbrando/projects/2

### 7.1 Final Readiness Checklist

- [ ] Every US-01–US-15 and RC-01–RC-14 appears in at least one Issue (Section 5.1).
- [ ] Every Issue has context, traceability, acceptance criteria, design references, dependencies, verification, and out-of-scope notes.
- [ ] All Issues are in the GitHub Project with Status, Phase, Human Review, Sequence, and Priority set.
- [ ] Every Issue was personally reviewed and moved from Pending to Reviewed.
- [ ] Completed-phase Issues are closed with links to their merge commits.
- [ ] Open decisions D-01–D-05 are recorded and none are silently assumed by an Issue.
- [ ] `docs/ARCHITECTURE.md`, `docs/POLICY.md`, and `docs/ROADMAP.md` exist and agree with this plan.
- [ ] At least one Ready + Reviewed Issue with satisfied prerequisites exists for the first agent run (candidates: I-10, I-11, I-13, I-16).
