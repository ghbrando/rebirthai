import Link from "next/link";
import { requireProfile } from "@/lib/auth";

const links = [
  ["/dashboard", "Dashboard"],
  ["/coach", "Coach"],
  ["/editor", "Editor"],
  ["/preview", "Preview"],
  ["/publish", "Publish"],
  ["/contact", "Contact"],
  ["/share", "Share"],
  ["/settings", "Settings"],
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireProfile(); // RC-01: server-side session check for every author screen
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex gap-4 overflow-x-auto border-b px-4 py-3 text-sm">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="whitespace-nowrap hover:underline">
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
