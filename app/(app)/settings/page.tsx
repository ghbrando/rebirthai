import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { signOut } from "@/components/profile/actions";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const { user, profile } = await requireProfile();
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Link href="/dashboard" className="text-sm underline">Back to dashboard</Link>
      </div>
      <ProfileForm mode="update" userId={user.id} profile={profile} />
      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-medium">Account</h2>
        <p className="text-sm text-gray-700">Signed in as {user.email}</p>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="lg" className="h-11">Sign out</Button>
        </form>
        <p className="text-sm">
          <Link href="/publish" className="text-red-700 underline">Delete my testimony</Link>
        </p>
      </section>
    </main>
  );
}
