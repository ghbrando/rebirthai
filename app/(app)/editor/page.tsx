import { requireProfile } from "@/lib/auth";
import { TestimonyEditor } from "@/components/editor/testimony-editor";
import { EMPTY_CONTENT, type TestimonyContent } from "@/lib/types";

export default async function Page() {
  const { supabase, profile } = await requireProfile();

  let { data: testimony } = await supabase
    .from("testimonies")
    .select("id, draft_content")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!testimony) {
    const res = await supabase
      .from("testimonies")
      .insert({ profile_id: profile.id })
      .select("id, draft_content")
      .single();
    testimony = res.data;
  }
  if (!testimony) {
    return <main className="p-6">Could not load your testimony. Please refresh.</main>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Editor</h1>
      <TestimonyEditor
        testimonyId={testimony.id}
        initialContent={(testimony.draft_content as TestimonyContent) ?? EMPTY_CONTENT}
      />
    </main>
  );
}
