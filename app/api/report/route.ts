import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { HANDLE_REGEX } from "@/lib/types";

/** RC-13: store a content report for operator review. Accepts form posts or JSON. */
export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  let handle = "";
  let reason = "";
  let isForm = false;
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    handle = String(j.handle ?? "");
    reason = String(j.reason ?? "");
  } else {
    isForm = true;
    const f = await req.formData().catch(() => null);
    handle = String(f?.get("handle") ?? "");
    reason = String(f?.get("reason") ?? "");
  }
  handle = handle.toLowerCase().trim();
  reason = reason.trim().slice(0, 1000);
  if (!HANDLE_REGEX.test(handle) || reason.length < 3)
    return NextResponse.json({ error: "Please describe the problem (at least 3 characters)." }, { status: 400 });

  try {
    const admin = createServiceClient();
    const { data: t } = await admin.from("public_testimonies").select("id").eq("handle", handle).maybeSingle();
    if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { error } = await admin.from("reports").insert({ testimony_id: t.id, reason });
    if (error) throw error;
  } catch {
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }
  if (isForm) return NextResponse.redirect(new URL(`/u/${handle}?reported=1`, req.url), 303);
  return NextResponse.json({ ok: true });
}
