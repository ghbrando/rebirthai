import Link from "next/link";

/** Footer links to the privacy policy and terms of use (#25). Server component. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={`flex flex-wrap gap-x-4 text-sm text-gray-700 ${className}`}>
      <Link href="/privacy" className="inline-block py-2 underline underline-offset-2 hover:text-gray-900">
        Privacy policy
      </Link>
      <Link href="/terms" className="inline-block py-2 underline underline-offset-2 hover:text-gray-900">
        Terms of use
      </Link>
    </nav>
  );
}
