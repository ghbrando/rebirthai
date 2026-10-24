import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { TestimonyRenderer, collectMediaIds } from "@/components/testimony/Renderer";
import type { Testimony } from "@/lib/types";

export default async function Page() {
  const { supabase, profile } = await requireProfile();
  const { data } = await supabase
    .from("testimonies")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const t = data as Testimony | null;

  const mediaUrls: Record<string, string> = {};
  if (t) {
    const ids = collectMediaIds(t.draft_content);
    if (ids.length) {
      const { data: rows } = await supabase
        .from("media")
        .select("id, storage_path")
        .eq("testimony_id", t.id)
        .in("id", ids);
      const byPath = new Map((rows ?? []).map((r) => [r.storage_path as string, r.id as string]));
      const { data: signed } = await supabase.storage
        .from("media-private")
        .createSignedUrls([...byPath.keys()], 3600);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) {
          const id = byPath.get(s.path);
          if (id) mediaUrls[id] = s.signedUrl;
        }
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <p className="text-sm text-gray-700">Screen 7 · Preview — this is exactly how your page will look.</p>
      <div role="note" className="rounded-lg border border-amber-700 bg-amber-50 p-4 text-sm text-amber-950">
        Before you publish: have you named anyone who hasn&apos;t agreed to be named publicly (family, friends,
        others)? Consider removing or changing names. You can also publish as Unlisted, and unpublish or delete at
        any time.
      </div>
      <article className="space-y-4 rounded-lg border p-4 sm:p-6">
        <header>
          <p className="font-semibold">{profile.display_name}</p>
          {profile.bio && <p className="text-sm text-gray-700">{profile.bio}</p>}
        </header>
        <h1 className="text-3xl font-bold">{t?.title || "Untitled testimony"}</h1>
        {t && t.draft_content?.content?.length > 0 ? (
          <TestimonyRenderer content={t.draft_content} mediaUrls={mediaUrls} />
        ) : (
          <p className="text-gray-700">Nothing written yet. Use the coach or editor first.</p>
        )}
      </article>
      <div className="flex gap-3">
        <Link href="/editor" className="rounded-lg border px-4 py-2 text-sm">
          Back to editor
        </Link>
        <Link href="/publish" className="rounded-lg bg-black px-4 py-2 text-sm text-white">
          Continue to publish
        </Link>
      </div>
    </main>
  );
}
