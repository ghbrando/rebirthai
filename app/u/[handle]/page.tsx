import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { TestimonyRenderer, collectMediaIds } from "@/components/testimony/Renderer";
import { createServiceClient } from "@/lib/supabase/server";
import type { TestimonyContent } from "@/lib/types";

type Loaded =
  | { kind: "ok"; profile: PublicProfile; t: PublicTestimony }
  | { kind: "redirect"; to: string }
  | { kind: "unavailable" }
  | { kind: "missing" };

interface PublicProfile {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  photo_path: string | null;
  church: string | null;
  share_contact: boolean;
}
interface PublicTestimony {
  id: string;
  title: string | null;
  content: TestimonyContent | null;
  visibility: "public" | "unlisted";
  published_at: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/media-public/${path}`;

/** Anon-safe reads only: public_profiles / public_testimonies / handle_lookup views (RC-02). */
const load = cache(async (rawHandle: string): Promise<Loaded> => {
  const handle = decodeURIComponent(rawHandle).replace(/^@/, "").toLowerCase();
  if (!SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return { kind: "missing" };
  try {
    const db = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: profile } = await db.from("public_profiles").select("*").eq("handle", handle).maybeSingle();
    if (profile) {
      const { data: t } = await db.from("public_testimonies").select("*").eq("handle", handle).maybeSingle();
      if (t) return { kind: "ok", profile: profile as PublicProfile, t: t as PublicTestimony };
    }
    const { data: old } = await db.from("handle_lookup").select("new_handle").eq("old_handle", handle).maybeSingle();
    if (old?.new_handle) return { kind: "redirect", to: old.new_handle as string };
    // Distinguish "exists but not published" from "doesn't exist" (service client, existence only).
    try {
      const { data: exists } = await createServiceClient()
        .from("profiles")
        .select("id")
        .eq("handle", handle)
        .maybeSingle();
      if (exists) return { kind: "unavailable" };
    } catch {
      /* service key absent: fall through */
    }
    return { kind: "missing" };
  } catch {
    return { kind: "missing" };
  }
});

function siteUrl() {
  const u = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return new URL(u);
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const r = await load(handle);
  if (r.kind !== "ok") return { title: "Testimony not available", robots: { index: false } };
  const title = r.t.title || `${r.profile.display_name}'s testimony`;
  const og = `/api/og?name=${encodeURIComponent(r.profile.display_name)}&title=${encodeURIComponent(title)}`;
  const description = r.profile.bio ?? `${r.profile.display_name} shares their testimony.`;
  return {
    metadataBase: siteUrl(),
    title: `${title} — ${r.profile.display_name}`,
    description,
    robots: r.t.visibility === "unlisted" ? { index: false, follow: false } : undefined, // RC-06
    openGraph: { title, description, type: "article", images: [og], authors: [r.profile.display_name] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const { handle } = await params;
  const { reported } = await searchParams;
  const r = await load(handle);
  if (r.kind === "redirect") permanentRedirect(`/u/${r.to}`); // RC-03: 308
  if (r.kind === "missing") notFound();
  if (r.kind === "unavailable")
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-semibold">This testimony isn&apos;t available</h1>
        <p className="mt-2 text-gray-700">The author may have unpublished it or it hasn&apos;t been published yet.</p>
      </main>
    );

  const { profile, t } = r;
  // Resolve public media URLs from media.public_path (media table is not anon-readable).
  const mediaUrls: Record<string, string> = {};
  const ids = collectMediaIds(t.content);
  if (ids.length) {
    try {
      const { data: rows } = await createServiceClient()
        .from("media")
        .select("id, public_path")
        .eq("testimony_id", t.id)
        .in("id", ids);
      for (const m of rows ?? []) if (m.public_path) mediaUrls[m.id as string] = publicUrl(m.public_path as string);
    } catch {
      /* media omitted if service key is unavailable */
    }
  }
  const photo = profile.photo_path ? publicUrl(profile.photo_path) : null;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={`Photo of ${profile.display_name}`} className="h-20 w-20 rounded-full object-cover" />
        )}
        <div>
          <p className="text-xl font-semibold">{profile.display_name}</p>
          {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
          {profile.church && <p className="text-sm text-gray-700">{profile.church}</p>}
        </div>
      </header>

      {profile.share_contact && (
        <a
          href={`/api/vcard/${profile.handle}`}
          className="inline-block rounded-lg bg-black px-4 py-2 text-white"
        >
          Save contact
        </a>
      )}

      <article className="space-y-4">
        {t.title && <h1 className="text-3xl font-bold">{t.title}</h1>}
        <TestimonyRenderer content={t.content} mediaUrls={mediaUrls} />
      </article>

      <footer className="border-t pt-4 text-sm text-gray-700">
        {reported ? (
          <p role="status">Thank you. Your report was submitted for review.</p>
        ) : (
          <details>
            <summary className="cursor-pointer underline">Report this testimony</summary>
            <form method="post" action="/api/report" className="mt-3 space-y-2">
              <input type="hidden" name="handle" value={profile.handle} />
              <label className="block">
                What&apos;s the problem?
                <textarea
                  name="reason"
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={3}
                  className="mt-1 w-full rounded border p-2 text-gray-900"
                />
              </label>
              <button className="rounded border px-3 py-1">Submit report</button>
            </form>
          </details>
        )}
      </footer>
    </main>
  );
}
