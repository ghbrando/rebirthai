import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import type { Testimony } from "@/lib/types";
import { DEFAULT_VISIBILITY } from "@/lib/visibility";
import { permanentUrl } from "@/lib/vcard/build";
import { takedownNotice } from "@/lib/takedown";
import { TakedownNotice } from "@/components/TakedownNotice";
import { PublishPanel } from "./PublishPanel";

function statusSentence(status: Testimony["status"] | undefined): string {
  if (status === "published")
    return "Your testimony is published. Changes you make in the editor won't show on your page until you press Republish.";
  if (status === "unpublished")
    return "Your testimony is not published right now, so nobody can open your page. Press Publish to put it back online.";
  return "You haven't published your testimony yet. Only you can see it until you press Publish.";
}

export default async function Page() {
  const { supabase, profile } = await requireProfile();
  const { data } = await supabase
    .from("testimonies")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const t = data as Testimony | null;
  const notice = takedownNotice(t);
  const canPublish = !!t && !notice && !!t.title.trim() && (t.draft_content?.content?.length ?? 0) > 0;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Publish</h1>
      <p className="text-sm text-gray-700">
        {!notice && <>{statusSentence(t?.status)} </>}
        <Link href="/preview" className="text-blue-800 underline">
          Review preview
        </Link>
      </p>
      <TakedownNotice notice={notice} />
      <PublishPanel
        status={t?.status ?? "draft"}
        visibility={t && t.status !== "draft" ? t.visibility : DEFAULT_VISIBILITY}
        url={permanentUrl(profile.handle)}
        canPublish={canPublish}
        takenDown={!!notice}
      />
    </main>
  );
}
