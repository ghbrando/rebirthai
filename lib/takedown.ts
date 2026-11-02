// #27: what an author sees after the operator takes their page down.
import type { Testimony } from "@/lib/types";

export const TAKEDOWN_BLOCKED_MESSAGE =
  "Your page was taken down after a report, so it can't be published right now. Please contact the operator to talk it through.";

export interface TakedownNotice {
  message: string;
  reason: string;
  contactEmail: string | null;
}

/** Plain-words notice for the author, or null when the page was not taken down. Use on publish and dashboard. */
export function takedownNotice(
  t: Pick<Testimony, "takedown_at" | "takedown_reason"> | null | undefined,
  env: Record<string, string | undefined> = process.env,
): TakedownNotice | null {
  if (!t?.takedown_at) return null;
  return {
    message: "Your page was taken down after a report, so it is no longer visible to anyone. Your story is safe and unchanged.",
    reason: t.takedown_reason?.trim() || "No reason was recorded.",
    contactEmail: env.OPERATOR_CONTACT_EMAIL?.trim() || null,
  };
}
