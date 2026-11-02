---
pr: 40
issues: [26]
date: 2026-11-02
branch: feature/26-delete-account
merge_commit: pending
author: Implementation agent, from owner-approved Issue #26
ids: [RC-01, RC-02, RC-03, RC-06, RC-07, US-12]
areas: [lib/account, app/api/account/delete, app/settings, components/profile, app/account-deleted, app/u/[handle], app/api/vcard/[handle], supabase/migrations/0002_retired_handles.sql, lib/types.ts, docs/POLICY.md, docs/ARCHITECTURE.md]
type: feature
status: open
---

# Delete my account and all my data

## Summary
Authors can permanently delete their account from Settings. It removes their profile, testimony,
coach conversations, photos and videos (both storage buckets) and the sign-in account, then signs
them out and shows "Your account has been deleted". Anyone opening the old link or contact card
sees "This testimony is no longer available", and the handle can never be taken by someone else.

## Context
Issue #26 (private beta prerequisite, `docs/BETA_PLAN.md`). Before this, authors could only delete
their testimony (`/api/publish` action `delete`, US-12); the profile, photo and sign-in account
stayed. Acceptance: plain-language confirmation with a deliberate step; server route deletes only
the caller's data with public content first and safe retry; friendly page for the deleted link and
vCard; handle behavior per RC-03; unit tests.

## What changed
- `lib/account/delete.ts` (new): `deleteAccount(userId, ports)` runs the steps in a fixed order over
  an injected `DeletionPorts` interface, wraps failures in `AccountDeletionError(step)`, refuses a
  missing/invalid user id (`NotSignedInError`), and only removes listed storage paths that sit inside
  the caller's own prefix. `CONFIRM_WORD = "DELETE"`.
- `lib/account/supabase-ports.ts` (new): ports backed by the caller's RLS client (all table rows) and
  the service-role client (storage listing/removal, recursive and paginated; `auth.admin.deleteUser`,
  where 404 counts as done).
- `app/api/account/delete/route.ts` (new): `POST { confirm: "DELETE" }`; `getUserOrNull()` (401
  otherwise); user id only from the session; logs only the failed step name; signs out
  (`scope: "local"`) after success.
- `components/profile/delete-account.tsx` (new, client) and `app/settings/page.tsx`: a red-bordered
  "Delete my account" section below Account, separated by a rule. Opening it lists what is lost,
  says the link stops showing the story and the handle is never reused, and needs `DELETE` typed.
- `app/account-deleted/page.tsx` (new): plain confirmation page (noindex).
- `app/u/[handle]/page.tsx`: new `gone` state via `rpc("is_handle_retired")` (anon key), rendering
  "This testimony is no longer available / The author has removed it." Never-existing handles still
  404 as before.
- `app/api/vcard/[handle]/route.ts`: a retired handle redirects (307) to `/u/<handle>`, i.e. the same
  friendly page, instead of a bare 404.
- `components/profile/actions.ts` `checkHandle`: retired handles show as "already in use".
- `supabase/migrations/0002_retired_handles.sql` (new), `lib/types.ts` (`RetiredHandle`).
- `docs/POLICY.md` §7 and §11, `docs/ARCHITECTURE.md` §3 and rule 4, `README.md` (apply all migrations).

### Deletion order
1. Look up own profile/testimony (RLS). 2. Unpublish (status `unpublished`, published copy cleared)
so the page goes dark. 3. `media-public/{testimony_id}/…`. 4. `media-public/avatars/{user_id}/…`.
5. `media-private/{user_id}/…`. 6. Coach messages. 7. Media rows. 8. Testimony. 9. Profile (trigger
retires its handles). 10. `auth.admin.deleteUser`. Then sign-out.

## Decisions and alternatives
- **Handles of deleted accounts are retired, not released (RC-03, POLICY §11).** RC-03: "a released
  handle is never reassigned to another user"; a link saved in contacts can never be updated, so it
  must never lead to a stranger's story. Without a change, deleting the profile frees
  `profiles.handle` and cascades away `handle_redirects`, so the handle would become claimable. New
  table `retired_handles (handle, retired_at)`, filled by a `BEFORE DELETE` trigger on `profiles`
  (current handle plus every old handle from `handle_redirects`), so it also works when the profile
  is removed by the `auth.users` cascade. `guard_handle()` is redefined to reject retired handles.
  Rejected: keeping a tombstone profile row (keeps a row tied to the person; conflicts with "delete
  all my data"); releasing the handle (violates RC-03).
- **No personal data kept.** Only the handle text and a timestamp; no user id. The handle was
  already public. `is_handle_retired(h)` answers one handle at a time (security definer), so the
  list cannot be enumerated; the table has RLS on with no policies.
- **Rows via the caller's RLS client, service role only where needed.** Postgres guarantees only the
  caller's rows go (RC-02). Service role is limited to storage (authors cannot write
  `media-public/{testimony_id}`) and deleting the auth user (RC-07; ARCHITECTURE rule 4 updated).
- **Auth user last, public content first.** A failure part-way leaves the author signed in so they
  can retry, and never leaves the story or photo public. Every step is idempotent.
- **Confirmation word `DELETE`** (checked on the client and again on the server) rather than the
  handle: easier to type on a phone, and still deliberate.
- **vCard redirects to the page** rather than returning its own HTML, so there is one wording.

## Assumptions and open questions
- Reports about a deleted testimony are removed by the existing `reports` cascade. The operator loses
  those reports; if they must be kept for abuse review, that needs a separate decision.
- A person who deletes and signs up again cannot get their old handle back.
- If the profile row is gone but deleting the sign-in account failed, Settings would send the
  author to onboarding; the open confirmation retries cleanly, and the route itself works without a
  profile.

## Interfaces, data and configuration
- **Schema change (needs owner approval before applying):** `0002_retired_handles.sql` adds
  `public.retired_handles`, trigger `profiles_retire_handles`, function `is_handle_retired(text)`
  (granted to anon, authenticated), and replaces `guard_handle()`.
- New route `POST /api/account/delete` → `{ ok: true }` | `{ error }` (400/401/500).
- New page `/account-deleted`. No new env vars or dependencies.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test` pass.
- `lib/account/delete.test.ts`: order (public first, auth user last), only the caller's data and
  storage folders, a leaked foreign path is never removed, public content is gone before a later
  failure, retry after a failure at each step finishes, no-profile accounts, unauthenticated refusal.
- `app/api/account/delete/route.test.ts`: 401 when signed out, 400 without `DELETE`, deletes the
  session user even if the body names another id, signs out.
- Not run against a live Supabase in this change (no local stack available to this agent); the
  migration and storage listing are verified by reading only.

## Known limitations and follow-ups
- Pages already cached by a recipient's browser or a link preview service may show old content until
  refreshed.
- Before 0002 is applied, deletion still works, but the handle could be claimed again and the link
  shows a 404 instead of the friendly page.

## Risks and rollback
- Deletion is irreversible by design. Rollback of the code: revert the PR. Rollback of 0002: drop the
  trigger, function and table and restore `guard_handle()` from 0001 (only if no accounts were deleted
  meanwhile, otherwise their handles become claimable).

## Notes for future agents
- Any new storage location for user files must be added to `ownedPrefixes()` in
  `lib/account/delete.ts`, or account deletion will leave it behind.
- Any new table holding user data should cascade from `profiles`/`testimonies` or get a step here.
- Never pass a user id from the request into `deleteAccount`; use the session user.

## Related
- `docs/changelog/2026-10-24-publish-public-page.md` (testimony delete, public page),
  `docs/changelog/2026-10-24-auth-profile.md` (handles), `docs/changelog/2026-10-27-pr-30-beta-plan.md`
  (Issue created). POLICY §7, §11; ARCHITECTURE rules 1–4, 6, 8.
