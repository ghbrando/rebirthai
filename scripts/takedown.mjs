// Operator-only: take a page down after a report, or restore it. Works against local and hosted projects.
// Never edits the author's draft or published story; it only unpublishes and records a reason.
// See docs/OPERATIONS.md. Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/takedown.mjs <handle> "<reason>" --yes
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/takedown.mjs <handle> --restore --yes
import { createClient } from "@supabase/supabase-js";
import { parseArgs, validateEnv, USAGE } from "./takedown-args.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.ok) {
  console.error(`${args.error}\n\n${USAGE}`);
  process.exit(2);
}
const envError = validateEnv(process.env);
if (envError) {
  console.error(envError);
  process.exit(2);
}

const url = process.env.SUPABASE_URL;
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const host = new URL(url).host;

function fail(msg) {
  console.error(`FAILED: ${msg}`);
  process.exit(1);
}

/** Lists every file under a prefix (paged past 1000), failing loudly on any error. */
async function listAll(bucket, prefix) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) fail(`list ${bucket}/${prefix}: ${error.message}`);
    out.push(...data.filter((f) => f.id).map((f) => `${prefix}/${f.name}`));
    if (data.length < 1000) return out;
  }
}

async function removeAll(bucket, paths) {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await db.storage.from(bucket).remove(paths.slice(i, i + 100));
    if (error) fail(`remove from ${bucket}: ${error.message}`);
  }
}

const { data: profile, error: pErr } = await db
  .from("profiles")
  .select("id, user_id, display_name")
  .eq("handle", args.handle)
  .maybeSingle();
if (pErr) fail(`profiles: ${pErr.message}`);
if (!profile) {
  console.error(`No page with handle @${args.handle}.`);
  process.exit(1);
}
const { data: t, error: tErr } = await db
  .from("testimonies")
  .select("id, status, takedown_at, takedown_reason")
  .eq("profile_id", profile.id)
  .single();
if (tErr) fail(`testimonies: ${tErr.message}`);

console.log(`Project:  ${host}`);
console.log(`Page:     @${args.handle} (${profile.display_name}), status ${t.status}${t.takedown_at ? ", already taken down" : ""}`);
if (args.restore) {
  console.log("Action:   RESTORE. Clears the takedown notice. The page stays unpublished; the author can publish again.");
} else {
  console.log("Action:   TAKE DOWN. Unpublishes the page and removes its public media and profile photo copies. Story text is untouched.");
  console.log(`Reason:   ${args.reason}`);
}
if (!args.yes) {
  console.log("\nDry run only. Re-run with --yes to apply.");
  process.exit(0);
}

if (args.restore) {
  const { error } = await db.from("testimonies").update({ takedown_at: null, takedown_reason: null }).eq("id", t.id);
  if (error) fail(`restore: ${error.message}`);
  const { error: lErr } = await db.from("moderation_log").insert({ handle: args.handle, action: "restore", reason: null });
  if (lErr) fail(`restored, but could not write moderation_log: ${lErr.message}`);
  console.log(`Restored @${args.handle}. Tell the author they can publish again (and re-upload a profile photo if it was removed).`);
} else {
  const { error } = await db
    .from("testimonies")
    .update({ status: "unpublished", takedown_at: new Date().toISOString(), takedown_reason: args.reason })
    .eq("id", t.id);
  if (error) fail(`takedown: ${error.message}`);
  const { error: lErr } = await db.from("moderation_log").insert({ handle: args.handle, action: "takedown", reason: args.reason });
  if (lErr) fail(`page is down, but could not write moderation_log: ${lErr.message}`);
  // Same cleanup as the author's own Unpublish (private originals stay), plus the public profile photo.
  await removeAll("media-public", await listAll("media-public", t.id));
  await removeAll("media-public", await listAll("media-public", `avatars/${profile.user_id}`));
  const { error: mErr } = await db.from("media").update({ public_path: null }).eq("testimony_id", t.id);
  if (mErr) fail(`media rows: ${mErr.message}`);
  console.log(`Took down @${args.handle}. The author will see the reason next time they open the app.`);
}
