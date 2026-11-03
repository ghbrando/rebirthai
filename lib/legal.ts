// Privacy policy and terms of use (#25). Owner-only facts live here as placeholders so they are
// easy to find and fill in. While LEGAL_DRAFT is true, both pages show a "Draft" banner.
// To publish the final text: fill in every value below, have it reviewed, then set LEGAL_DRAFT = false.

/** Shows the "Draft — not reviewed by a lawyer" banner on /privacy and /terms. */
export const LEGAL_DRAFT = true;

/** Facts only the owner can decide. A value still in [BRACKETS] is unfilled. */
export const LEGAL = {
  operator: "[OPERATOR LEGAL NAME]",
  contactEmail: "[CONTACT EMAIL]",
  effectiveDate: "[EFFECTIVE DATE]",
  governingLaw: "[GOVERNING LAW / STATE]",
  /** Whether Anthropic keeps API data and uses it for training: confirm against Anthropic's current terms. */
  anthropicDataUse:
    "[ANTHROPIC DATA USE: confirm from Anthropic's current terms whether it keeps the messages, for how long, and whether it uses them to train its AI]",
  /** How long hosting request logs are kept (set with #19). */
  logRetention: "[LOG RETENTION PERIOD]",
} as const;

export const DRAFT_BANNER_TEXT = "Draft — not reviewed by a lawyer";

/** True for a value that has not been filled in yet. */
export function isPlaceholder(value: string): boolean {
  return /^\[[^\]]*\]$/.test(value.trim());
}

/** Keys whose value is still a placeholder. */
export function unfilledPlaceholders(values: Record<string, string> = LEGAL): string[] {
  return Object.entries(values)
    .filter(([, v]) => isPlaceholder(v))
    .map(([k]) => k);
}
