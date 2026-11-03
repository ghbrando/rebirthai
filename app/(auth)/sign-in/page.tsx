import { redirect } from "next/navigation";
import { getUserOrNull } from "@/lib/auth";
import { SignInForm } from "@/components/profile/sign-in-form";

export const metadata = { title: "Sign in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  // Demo mode skips this form, except after a failed demo sign-in: redirecting back would loop.
  if (process.env.DEMO_MODE === "1" && !error) redirect("/demo");
  const session = await getUserOrNull();
  if (session) redirect("/dashboard"); // dashboard's layout sends profile-less users to /onboarding
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Sign in to RebirthAI</h1>
        <p className="mt-1 text-sm text-gray-600">Share your testimony. No password needed.</p>
      </div>
      <SignInForm initialError={error ? "Sign-in didn't complete. Please try again." : undefined} />
    </main>
  );
}
