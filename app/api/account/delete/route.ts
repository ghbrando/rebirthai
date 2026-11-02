import { NextResponse } from "next/server";
import { getUserOrNull } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AccountDeletionError, CONFIRM_WORD, deleteAccount } from "@/lib/account/delete";
import { supabaseDeletionPorts } from "@/lib/account/supabase-ports";

/** The Origin header must name this site: the request host, or NEXT_PUBLIC_SITE_URL's host. */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  const reqHost = req.headers.get("host") ?? new URL(req.url).host;
  if (reqHost) allowed.add(reqHost);
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host);
  } catch {
    /* ignore a malformed setting */
  }
  return allowed.has(host);
}

/**
 * POST { confirm: "DELETE" } — permanently deletes the caller's account and all their data (#26).
 * The user id comes only from the server-verified session (RC-01): a caller can delete only themself.
 */
export async function POST(req: Request) {
  // CSRF: only same-site JSON requests (a cross-site form cannot send application/json).
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json"))
    return NextResponse.json({ error: "Unsupported request" }, { status: 415 });

  const auth = await getUserOrNull();
  if (!auth) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { confirm?: unknown };
  if (body.confirm !== CONFIRM_WORD)
    return NextResponse.json({ error: `Type ${CONFIRM_WORD} to confirm.` }, { status: 400 });

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    await deleteAccount(auth.user.id, supabaseDeletionPorts(auth.supabase, admin));
  } catch (e) {
    // Log the step only: never user content (POLICY §7). Every step is safe to retry.
    const step = e instanceof AccountDeletionError ? e.step : "unknown";
    console.error(JSON.stringify({ event: "account_delete_failed", step }));
    return NextResponse.json(
      { error: "We couldn't finish deleting your account. Please try again." },
      { status: 500 },
    );
  }

  // The sign-in account is gone; clear the session cookies on this device.
  try {
    await auth.supabase.auth.signOut({ scope: "local" });
  } catch {
    /* session already invalid */
  }
  return NextResponse.json({ ok: true });
}
