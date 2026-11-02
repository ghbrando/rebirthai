# Operations (for the operator)

Short runbook for handling reports. Policy background: `docs/POLICY.md` section 9.

## Get a phone alert when someone reports a page

1. Install the free **ntfy** app on your phone (iOS or Android).
2. Subscribe to a private topic with a long random name, e.g. `rebirthai-reports-7f3k9q2xv8m4` (anyone who knows the name can read it, so make it unguessable and do not share it).
3. Set `REPORT_WEBHOOK_URL=https://ntfy.sh/rebirthai-reports-7f3k9q2xv8m4` in the hosting environment (Vercel: Project Settings, Environment Variables) and redeploy.
4. File a test report on a page. You should get "RebirthAI report: @handle" with the page link and the time. Read the reporter's text in the `reports` table.

Any service that accepts a plain-text POST also works. The alert never contains the reporter's address, text or the story. The URL must be https. At most one alert per page per hour is sent. If the alert fails or the variable is unset, the report is still saved (table `reports`); check it in the Supabase table editor.

## Take a page down, or bring it back

Needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` of the project (keep the key out of shell history and files you commit). Run from the repo root:

```bash
# preview only
node scripts/takedown.mjs maria_g "Names a private person without their consent."
# apply (add --yes)
node scripts/takedown.mjs maria_g "Names a private person without their consent." --yes
# undo
node scripts/takedown.mjs maria_g --restore --yes
```

- Taking down unpublishes the page (visitors see the normal "not available" page) and removes its public photo/video copies. The author's draft and published text are not touched.
- Write the reason in plain words: the author reads it next time they open the app, together with `OPERATOR_CONTACT_EMAIL` if set.
- The author cannot republish while taken down. After `--restore` the page stays unpublished until they publish again.
- Afterwards, mark the report handled: in the `reports` table set `status` to `reviewed` or `dismissed`.

## One-time setup

Apply `supabase/migrations/0003_takedown.sql` (takedown columns, a guard so only the operator can write them, `moderation_log`, and report handles) before using the script.

## Retention

Reports (with the page handle) and the `moderation_log` are kept about 90 days after a page or account is deleted, then purged by hand: `delete from reports where created_at < now() - interval '90 days' and testimony_id is null;` and the same for `moderation_log`. Takedown also removes the author's public profile photo; after a restore they re-upload it.
