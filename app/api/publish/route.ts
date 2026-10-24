import { NextResponse } from "next/server";
import { getUserOrNull } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { collectMediaIds } from "@/components/testimony/Renderer";
import type { Testimony, Media } from "@/lib/types";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

/** POST { action: "publish" | "unpublish" | "delete", visibility? } — US-12, US-14. Session verified (RC-01). */
export async function POST(req: Request) {
  const auth = await getUserOrNull();
  if (!auth) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; visibility?: string };

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });
  const { data: tRow } = await auth.supabase
    .from("testimonies")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const t = tRow as Testimony | null;
  if (!t) return NextResponse.json({ error: "No testimony" }, { status: 404 });

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const listAll = async (bucket: string, prefix: string) => {
    const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    return (data ?? []).map((f) => `${prefix}/${f.name}`);
  };

  // Ownership is established above (testimony fetched via RLS as the user); service client acts only on t.id.
  const removePublicFiles = async () => {
    const files = await listAll("media-public", t.id);
    if (files.length) await admin.storage.from("media-public").remove(files);
    await admin.from("media").update({ public_path: null }).eq("testimony_id", t.id);
  };

  if (body.action === "publish") {
    const visibility = body.visibility === "unlisted" ? "unlisted" : "public";
    if (!t.title.trim() || !t.draft_content?.content?.length)
      return NextResponse.json({ error: "Add a title and some content before publishing." }, { status: 400 });

    const ids = collectMediaIds(t.draft_content);
    const { data: rows } = ids.length
      ? await admin.from("media").select("*").eq("testimony_id", t.id).in("id", ids)
      : { data: [] as Media[] };
    // clear stale public files from a previous publish, then copy current ones
    await removePublicFiles();
    for (const m of (rows ?? []) as Media[]) {
      const ext = EXT[m.mime] ?? m.storage_path.split(".").pop() ?? "bin";
      const dest = `${t.id}/${m.id}.${ext}`;
      const { error } = await admin.storage
        .from("media-private")
        .copy(m.storage_path, dest, { destinationBucket: "media-public" });
      if (error) return NextResponse.json({ error: `Media copy failed: ${error.message}` }, { status: 500 });
      await admin.from("media").update({ public_path: dest }).eq("id", m.id);
    }
    const { error } = await admin
      .from("testimonies")
      .update({
        published_content: t.draft_content,
        published_title: t.title,
        status: "published",
        visibility,
        published_at: new Date().toISOString(),
      })
      .eq("id", t.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "unpublish") {
    await admin.from("testimonies").update({ status: "unpublished" }).eq("id", t.id);
    await removePublicFiles();
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    // US-12: remove messages, media rows, all storage files, then reset the single testimony row.
    const { data: media } = await admin.from("media").select("storage_path").eq("testimony_id", t.id);
    const privatePaths = [
      ...(media ?? []).map((m) => m.storage_path as string),
      ...(await listAll("media-private", `${auth.user.id}/${t.id}`)),
    ];
    if (privatePaths.length) await admin.storage.from("media-private").remove([...new Set(privatePaths)]);
    await removePublicFiles();
    await admin.from("coach_messages").delete().eq("testimony_id", t.id);
    await admin.from("media").delete().eq("testimony_id", t.id);
    await admin
      .from("testimonies")
      .update({
        title: "",
        draft_content: { type: "doc", content: [] },
        published_content: null,
        published_title: null,
        status: "draft",
        visibility: "public",
        published_at: null,
      })
      .eq("id", t.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
