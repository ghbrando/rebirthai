import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Account deleted", robots: { index: false } };

/** Shown after an author deletes their account (#26). Public: the user is signed out by now. */
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Your account has been deleted</h1>
      <p className="text-gray-700">
        Your profile, testimony, coach conversations, photos and videos have been removed. Your link
        now shows that the testimony is no longer available.
      </p>
      <p>
        <Link href="/" className="underline">
          Go to the home page
        </Link>
      </p>
    </main>
  );
}
