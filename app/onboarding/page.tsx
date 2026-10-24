import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function Page() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (data) redirect("/dashboard");
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Set up your profile</h1>
      <p className="mb-6 mt-1 text-sm text-gray-600">This is how readers will see you.</p>
      <ProfileForm mode="create" userId={user.id} />
    </main>
  );
}
