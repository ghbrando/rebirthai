import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import type { Testimony } from "@/lib/types";
import { PublishPanel } from "./PublishPanel";

export default async function Page() {
  const { supabase, profile } = await requireProfile();
  const { data } = await supabase
    .from("testimonies")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const t = data as Testimony | null;
  const canPublish = !!t && !!t.title.trim() && (t.draft_content?.content?.length ?? 0) > 0;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <p className="text-sm text-gray-700">Screen 8</p>
      <h1 className="text-2xl font-semibold">Publish</h1>
      <p className="text-sm text-gray-700">
        Status: <b>{t?.status ?? "draft"}</b>. Publishing makes a snapshot; later edits stay private until you
        republish.{" "}
        <Link href="/preview" className="text-blue-800 underline">
          Review preview
        </Link>
      </p>
      <PublishPanel
        status={t?.status ?? "draft"}
        visibility={t?.visibility ?? "public"}
        handle={profile.handle}
        canPublish={canPublish}
      />
    </main>
  );
}
