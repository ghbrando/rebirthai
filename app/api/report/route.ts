import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { HANDLE_REGEX } from "@/lib/types";
import { notifyOperatorOfReport } from "@/lib/report-notify";
import { clientIp, rateLimited } from "@/lib/rate-limit";

const HOUR = 3_600_000;
const MAX_REPORTS_PER_HANDLE_PER_HOUR = 20;

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

  const tooMany = NextResponse.json({ error: "Too many reports right now. Please try again later." }, { status: 429 });
  // Per IP (in memory, IP never stored) and per handle (below, durable).
  if (rateLimited(`ip:${clientIp(req)}`, 5, HOUR)) return tooMany;

  let notify = false;
  try {
    const admin = createServiceClient();
    const { data: t } = await admin.from("public_testimonies").select("id").eq("handle", handle).maybeSingle();
    if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const since = new Date(Date.now() - HOUR).toISOString();
    const { count } = await admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("handle", handle)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_REPORTS_PER_HANDLE_PER_HOUR) return tooMany;
    const { error } = await admin.from("reports").insert({ testimony_id: t.id, handle, reason });
    if (error) throw error;
    notify = (count ?? 0) === 0; // at most one alert per handle per hour
  } catch {
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }
  // Best effort (#27): never fails the report, never throws.
  if (notify) await notifyOperatorOfReport({ handle, reportedAt: new Date() });
  if (isForm) return NextResponse.redirect(new URL(`/u/${handle}?reported=1`, req.url), 303);
  return NextResponse.json({ ok: true });
}
