import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { permanentUrl } from "@/lib/vcard/build";
import { dashboardCopy, deriveDashboardState } from "@/lib/dashboard/state";
import type { Testimony } from "@/lib/types";

const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded bg-black px-5 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";
const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded border border-black px-5 py-2 text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

export default async function Page() {
  const { supabase, profile } = await requireProfile();
  const { data } = await supabase
    .from("testimonies")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const t = data as Testimony | null;

  let coachMessageCount = 0;
  if (t) {
    const { count } = await supabase
      .from("coach_messages")
      .select("id", { count: "exact", head: true })
      .eq("testimony_id", t.id);
    coachMessageCount = count ?? 0;
  }

  const state = deriveDashboardState({ testimony: t, coachMessageCount });
  const hasDraftContent = (t?.draft_content?.content?.length ?? 0) > 0;
  const copy = dashboardCopy(state, profile.handle, hasDraftContent);
  const isPublished = state === "published_public" || state === "published_unlisted";
  const url = permanentUrl(profile.handle);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Welcome, {profile.display_name}</h1>
      <section aria-labelledby="where" className="space-y-4 rounded border p-4 sm:p-6">
        <h2 id="where" className="text-xl font-semibold">
          {copy.heading}
        </h2>
        <p className="text-gray-700">{copy.body}</p>
        {isPublished && (
          <p className="text-gray-700">
            Your permanent link:{" "}
            <a href={url} className="break-all text-blue-800 underline">
              {url}
            </a>
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href={copy.primary.href} className={primaryBtn}>
            {copy.primary.label}
          </Link>
          {copy.secondary.map((a) => (
            <Link key={a.href} href={a.href} className={secondaryBtn}>
              {a.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
