import type { Visibility } from "@/lib/types";

/** Owner decision D-09: default visibility on the publish screen. Flip to "public" to change it (UI default only). */
export const DEFAULT_VISIBILITY: Visibility = "unlisted";

export const VISIBILITY_TEXT = {
  public: "Anyone can find your testimony, including through Google.",
  unlisted: "Only people you give your link or QR code to can read it. It won't show up in Google.",
} as const;

/** Shown identically in settings and on the contact page. */
export const CONTACT_CONSENT_TEXT =
  "If this is on, anyone who opens your testimony link can see and save your phone number and email.";
