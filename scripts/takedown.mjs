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

const { data: profile, error: pErr } = await db.from("profiles").select("id, display_name").eq("handle", args.handle).maybeSingle();
if (pErr) throw new Error(`profiles: ${pErr.message}`);
if (!profile) {
  console.error(`No page with handle @${args.handle}.`);
  process.exit(1);
}
const { data: t, error: tErr } = await db
  .from("testimonies")
  .select("id, status, takedown_at, takedown_reason")
  .eq("profile_id", profile.id)
  .single();
if (tErr) throw new Error(`testimonies: ${tErr.message}`);

console.log(`Project:  ${host}`);
console.log(`Page:     @${args.handle} (${profile.display_name}), status ${t.status}${t.takedown_at ? ", already taken down" : ""}`);
if (args.restore) {
  console.log("Action:   RESTORE. Clears the takedown notice. The page stays unpublished; the author can publish again.");
} else {
  console.log(`Action:   TAKE DOWN. Unpublishes the page and removes its public media copies. Story text is untouched.`);
  console.log(`Reason:   ${args.reason}`);
}
if (!args.yes) {
  console.log("\nDry run only. Re-run with --yes to apply.");
  process.exit(0);
}

if (args.restore) {
  const { error } = await db.from("testimonies").update({ takedown_at: null, takedown_reason: null }).eq("id", t.id);
  if (error) throw new Error(`restore: ${error.message}`);
  console.log(`Restored @${args.handle}. Tell the author they can publish again.`);
} else {
  const { error } = await db
    .from("testimonies")
    .update({ status: "unpublished", takedown_at: new Date().toISOString(), takedown_reason: args.reason })
    .eq("id", t.id);
  if (error) throw new Error(`takedown: ${error.message}`);
  // Same cleanup as the author's own Unpublish: public copies of media go away; private originals stay.
  const { data: files } = await db.storage.from("media-public").list(t.id, { limit: 1000 });
  if (files?.length) await db.storage.from("media-public").remove(files.map((f) => `${t.id}/${f.name}`));
  await db.from("media").update({ public_path: null }).eq("testimony_id", t.id);
  console.log(`Took down @${args.handle}. The author will see the reason next time they open the app.`);
}
