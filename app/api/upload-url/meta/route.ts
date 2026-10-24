import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserOrNull } from "@/lib/auth";

const Body = z.object({
  mediaId: z.string().uuid(),
  altText: z.string().trim().min(1, "Alt text is required").max(500),
  caption: z.string().max(500).nullable().optional(),
});

/** PATCH alt_text/caption on a media row (RC-11: alt text must be non-empty). */
export async function PATCH(req: Request) {
  const auth = await getUserOrNull();
  if (!auth) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { mediaId, altText, caption } = parsed.data;
  const { data, error } = await auth.supabase
    .from("media")
    .update({ alt_text: altText, caption: caption || null })
    .eq("id", mediaId)
    .select("id");
  if (error || !data?.length) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
