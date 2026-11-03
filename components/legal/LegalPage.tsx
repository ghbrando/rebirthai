import Link from "next/link";
import type { ReactNode } from "react";
import { DRAFT_BANNER_TEXT, LEGAL, LEGAL_DRAFT } from "@/lib/legal";
import { LegalLinks } from "./LegalLinks";

/** Shared layout for /privacy and /terms (#25): same width, font and spacing as the public page. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      {LEGAL_DRAFT && (
        <div role="note" className="rounded-lg border border-amber-700 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">{DRAFT_BANNER_TEXT}</p>
          <p className="mt-1">
            This text is still being written. Parts in [square brackets] are not filled in yet.
          </p>
        </div>
      )}
      <header className="space-y-1">
        <p>
          <Link href="/" className="inline-block py-1 text-sm text-gray-700 underline underline-offset-2">
            RebirthAI
          </Link>
        </p>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-sm text-gray-700">Effective date: {LEGAL.effectiveDate}</p>
      </header>
      <article className="space-y-8 leading-relaxed text-gray-900">{children}</article>
      <footer className="border-t pt-2">
        <LegalLinks />
      </footer>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}

export function ContactLine() {
  return (
    <p>
      Questions? Write to {LEGAL.operator} at {LEGAL.contactEmail}.
    </p>
  );
}
