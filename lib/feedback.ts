// Where the "Send feedback" link goes (#28). Set NEXT_PUBLIC_FEEDBACK_URL to a form or mailto: link.

/** The configured feedback target, or null (hide the link) when unset or not an http(s)/mailto link. */
export function getFeedbackUrl(raw: string | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  try {
    const { protocol } = new URL(v);
    return protocol === "https:" || protocol === "http:" || protocol === "mailto:" ? v : null;
  } catch {
    return null;
  }
}
