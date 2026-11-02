import { NextResponse } from "next/server";
import { getUserOrNull } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AccountDeletionError, CONFIRM_WORD, deleteAccount } from "@/lib/account/delete";
import { supabaseDeletionPorts } from "@/lib/account/supabase-ports";

/**
 * POST { confirm: "DELETE" } — permanently deletes the caller's account and all their data (#26).
 * The user id comes only from the server-verified session (RC-01): a caller can delete only themself.
 */
export async function POST(req: Request) {
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
