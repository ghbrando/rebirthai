import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getFeedbackUrl } from "@/lib/feedback";

const links = [
  ["/dashboard", "Dashboard"],
  ["/coach", "Coach"],
  ["/editor", "Editor"],
  ["/preview", "Preview"],
  ["/publish", "Publish"],
  ["/contact", "Contact card"],
  ["/share", "Share"],
  ["/settings", "Settings"],
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireProfile(); // RC-01: server-side session check for every author screen
  const feedbackUrl = getFeedbackUrl(process.env.NEXT_PUBLIC_FEEDBACK_URL); // hidden when unset (#28)
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black"
      >
        Skip to main content
      </a>
      <nav aria-label="Main" className="grid grid-cols-4 border-b px-2 text-center text-sm sm:flex sm:gap-2 sm:px-4 sm:text-left">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="whitespace-nowrap py-2.5 hover:underline focus-visible:underline focus-visible:outline-2 sm:px-2">
            {label}
          </Link>
        ))}
      </nav>
      {children}
      {feedbackUrl && (
        <footer className="mt-auto px-4 py-4 text-center text-xs text-gray-500">
          <a
            href={feedbackUrl}
            target={feedbackUrl.startsWith("mailto:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="underline hover:text-gray-800"
          >
            Send feedback
          </a>
        </footer>
      )}
    </div>
  );
}
