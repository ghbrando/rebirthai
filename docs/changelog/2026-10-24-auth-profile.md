---
pr: none (feature branch feat/auth-profile merged directly; backfilled record)
issues: [3]
date: 2026-10-24
branch: feat/auth-profile
merge_commit: 8238c18
author: hackathon subagent A (Auth & Profile)
ids: [US-01, US-02, RC-01, RC-03, RC-12]
areas: [app/(auth)/sign-in, app/auth/callback, app/onboarding, app/settings, components/profile]
type: feature
status: merged
---

# Sign in, create a profile with a unique handle, and change it without breaking links

## Summary
Authors sign in with an email link or Google, set up a profile (name, handle, photo, bio, church),
and edit it in Settings. Changing a handle keeps old links working forever. Phone and email are
shared only when the author both enters them and turns sharing on.

## Context
SDD US-01, US-02 and constraints RC-01, RC-03, RC-12. Screens 2, 3 and 11.

## What changed
- `components/profile/sign-in-form.tsx`: email magic link and Google OAuth via Supabase.
- `app/auth/callback/route.ts`: exchanges the auth code and routes new users to onboarding,
  returning users to the dashboard.
- `components/profile/profile-form.tsx`: shared form for onboarding and settings; live handle check;
  photo upload.
- `components/profile/actions.ts`: server actions. Handle availability check (your own current and
  old handles count as available), create/update profile, write `handle_redirects` on change,
  contact fields saved only if entered **and** toggled on (RC-12).

## Decisions and alternatives
- **Handle rules enforced twice**: in the form for friendly errors and in the database for safety.
- **Old handles stay reserved** to their owner forever (RC-03), which is why your own old handles
  count as available to you and to no one else.
- **Server actions** instead of API routes for profile writes: less code, same server-side checks.

## Assumptions and open questions
- Google provider must be enabled in Supabase; untested (#18).

## Interfaces, data and configuration
Writes `profiles` and `handle_redirects`. Redirect URLs must include `/auth/callback`.

## Verification
Built and type-checked during the sprint. No live sign-in has been run (#18, #14).

## Known limitations and follow-ups
Dashboard (screen 4) is still a placeholder (#11).

## Risks and rollback
A bug in redirect writes would break saved contact links: treat `handle_redirects` changes as high risk.

## Notes for future agents
- Never reassign or delete a row in `handle_redirects`.
- Contact sharing requires both a value and the toggle; keep both checks if you touch the form.

## Related
[foundation](2026-10-24-foundation.md) · [public page](2026-10-24-publish-public-page.md) (redirect lookup) ·
[contact card](2026-10-24-contact-card-share.md) (uses opted-in fields) · POLICY §7
