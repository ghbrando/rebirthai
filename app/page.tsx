import Link from "next/link";
import { LegalLinks } from "@/components/legal/LegalLinks";

export default function Landing() {
  return (
    <main id="main-content" className="mx-auto flex max-w-2xl flex-1 flex-col justify-start gap-4 px-6 pb-6 pt-12">
      <h1 className="text-4xl font-bold">RebirthAI</h1>
      <p className="text-lg text-gray-700">
        RebirthAI is an AI coach that helps you tell your testimony and carry it on your contact card.
      </p>
      <Link href={process.env.DEMO_MODE === "1" ? "/demo" : "/sign-in"} className="w-fit rounded bg-[#7a2e3a] px-5 py-3 text-white">
        Get started
      </Link>
      <footer className="mt-auto border-t pt-2">
        <LegalLinks />
      </footer>
    </main>
  );
}
