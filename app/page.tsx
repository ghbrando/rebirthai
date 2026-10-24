import Link from "next/link";

export default function Landing() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-4 p-6">
      <h1 className="text-4xl font-bold">RebirthAI</h1>
      <p className="text-lg text-gray-700">
        Tell your story with an AI coach, then put it on your contact card so it travels with you.
      </p>
      <Link href="/sign-in" className="w-fit rounded bg-[#7a2e3a] px-5 py-3 text-white">
        Get started
      </Link>
    </main>
  );
}
