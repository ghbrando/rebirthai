import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserOrNull } from "@/lib/auth";
import { extForMime, validateMedia } from "@/lib/media/validate";
import type { UploadUrlResponse } from "@/lib/types";

const Body = z.object({
  testimonyId: z.string().uuid(),
  kind: z.enum(["image", "video"]),
  mime: z.string(),
  bytes: z.number().int().positive(),
});

export async function POST(req: Request) {
  const auth = await getUserOrNull(); // RC-01
  if (!auth) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { supabase, user } = auth;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { testimonyId, kind, mime, bytes } = parsed.data;

  const invalid = validateMedia(kind, mime, bytes);
  const ext = extForMime(mime);
  if (invalid || !ext) return NextResponse.json({ error: invalid ?? "Unsupported type" }, { status: 400 });

  // Ownership: the testimony must belong to the caller's profile.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: testimony } = profile
    ? await supabase
        .from("testimonies")
        .select("id")
        .eq("id", testimonyId)
        .eq("profile_id", profile.id)
        .maybeSingle()
    : { data: null };
  if (!testimony) return NextResponse.json({ error: "Testimony not found" }, { status: 404 });

  const mediaId = crypto.randomUUID();
  const path = `${user.id}/${testimonyId}/${mediaId}.${ext}`;

  const { error: insErr } = await supabase.from("media").insert({
    id: mediaId,
    testimony_id: testimonyId,
    kind,
    storage_path: path,
    mime,
    bytes,
  });
  if (insErr) return NextResponse.json({ error: "Could not record media" }, { status: 500 });

  const { data, error } = await supabase.storage.from("media-private").createSignedUploadUrl(path);
  if (error || !data) {
    await supabase.from("media").delete().eq("id", mediaId);
    return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 });
  }

  const out: UploadUrlResponse = { mediaId, bucket: "media-private", path, token: data.token };
  return NextResponse.json(out);
}
