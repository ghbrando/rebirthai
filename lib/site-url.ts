// The one place that decides the public origin used in absolute links, contact cards and QR codes.
// A card or QR code is permanent once shared, so production must never fall back to a test address.

function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/\/+$/, "");
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLocalHost(h: string): boolean {
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost");
}

/** True for localhost, 127.0.0.1, *.vercel.app, or an unparseable address (all test addresses). */
export function isTestHost(url: string): boolean {
  const h = hostOf(url);
  if (!h) return true;
  return isLocalHost(h) || h.endsWith(".vercel.app");
}

/**
 * Public site origin, no trailing slash.
 * - Production (NODE_ENV=production and VERCEL_ENV=production or unset): NEXT_PUBLIC_SITE_URL is
 *   required and must not be a test address, otherwise this throws.
 * - Vercel preview (VERCEL_ENV=preview): NEXT_PUBLIC_SITE_URL if set and not local, else https://VERCEL_URL.
 * - Local dev/test: NEXT_PUBLIC_SITE_URL, else http://localhost:3000.
 */
export function getSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = clean(env.NEXT_PUBLIC_SITE_URL);

  if (env.NODE_ENV === "production") {
    if (env.VERCEL_ENV === "preview") {
      const h = explicit ? hostOf(explicit) : null;
      if (explicit && h && !isLocalHost(h)) return explicit;
      const v = clean(env.VERCEL_URL);
      if (v) return `https://${v}`;
      throw new Error("Preview deployment has neither a usable NEXT_PUBLIC_SITE_URL nor VERCEL_URL.");
    }
    if (!explicit) {
      throw new Error("NEXT_PUBLIC_SITE_URL is not set. Contact cards and QR codes need the real public address in production.");
    }
    if (isTestHost(explicit)) {
      throw new Error(`NEXT_PUBLIC_SITE_URL (${explicit}) is a test address (localhost, 127.0.0.1 or *.vercel.app). Set the real public address for production.`);
    }
    return explicit;
  }
  return explicit || "http://localhost:3000";
}
