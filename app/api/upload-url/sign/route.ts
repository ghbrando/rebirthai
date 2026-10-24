import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserOrNull } from "@/lib/auth";

const Body = z.object({ mediaIds: z.array(z.string().uuid()).min(1).max(50) });

/** POST { mediaIds } -> { urls: { [mediaId]: signedUrl } }. 1-hour signed URLs; RLS limits to the caller's media. */
export async function POST(req: Request) {
  const auth = await getUserOrNull();
  if (!auth) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { supabase } = auth;
  const { data: rows } = await supabase
    .from("media")
    .select("id, storage_path")
    .in("id", parsed.data.mediaIds);
  const urls: Record<string, string> = {};
  for (const row of rows ?? []) {
    const { data } = await supabase.storage.from("media-private").createSignedUrl(row.storage_path, 3600);
    if (data?.signedUrl) urls[row.id] = data.signedUrl;
  }
  return NextResponse.json({ urls });
}
