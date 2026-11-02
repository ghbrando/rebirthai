// Argument handling for scripts/takedown.mjs (kept separate so it can be unit tested).
export const USAGE = `Usage:
  node scripts/takedown.mjs <handle> "<reason in plain words>" [--yes]
  node scripts/takedown.mjs <handle> --restore [--yes]
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Without --yes it only prints what it would do.`;

const HANDLE = /^[a-z0-9_]{3,30}$/;

/** Returns { ok: true, handle, restore, reason, yes } or { ok: false, error }. */
export function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const unknown = [...flags].filter((f) => !["--yes", "--restore"].includes(f));
  if (unknown.length) return { ok: false, error: `Unknown option: ${unknown[0]}` };
  const rest = argv.filter((a) => !a.startsWith("--"));
  const handle = (rest[0] ?? "").replace(/^@/, "").toLowerCase();
  if (!HANDLE.test(handle)) return { ok: false, error: "Give a valid handle (3-30 of a-z, 0-9, _)." };
  const restore = flags.has("--restore");
  const reason = (rest[1] ?? "").trim();
  if (rest.length > 2) return { ok: false, error: 'Quote the reason: "like this".' };
  if (restore) {
    if (reason) return { ok: false, error: "--restore takes no reason." };
  } else if (reason.length < 10) {
    return { ok: false, error: "Give a reason in plain words (at least 10 characters); the author will read it." };
  }
  return { ok: true, handle, restore, reason: restore ? null : reason.slice(0, 1000), yes: flags.has("--yes") };
}

/** Hosted projects are allowed, but the service key only travels over https (http only for localhost). */
export function validateEnv(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    return "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";
  let u;
  try {
    u = new URL(env.SUPABASE_URL);
  } catch {
    return "SUPABASE_URL is not a valid URL.";
  }
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(u.protocol === "http:" && local))
    return "SUPABASE_URL must be https (http is only allowed for localhost / 127.0.0.1).";
  return null;
}
