// vCard 3.0 builder (RFC 2426). No photo by design (RC-10).

export interface VCardInput {
  displayName: string;
  handle: string;
  /** Included only when shareContact is true (RC-12). */
  phone?: string | null;
  email?: string | null;
  shareContact?: boolean;
  /** Site origin, no trailing slash. Defaults to NEXT_PUBLIC_SITE_URL. */
  siteUrl?: string;
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** Permanent testimony URL (RC-03). */
export function permanentUrl(handle: string, siteUrl = getSiteUrl()): string {
  return `${siteUrl}/@${handle}`;
}

/** Escape a TEXT value: backslash, comma, semicolon, newline. */
export function escapeText(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

const encoder = new TextEncoder();

/** Fold a content line at 75 octets without splitting a UTF-8 code point. */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let cur = "";
  let curBytes = 0;
  let limit = 75; // first line 75 octets; continuation lines have a leading space so 74 of content
  for (const ch of line) {
    const b = encoder.encode(ch).length;
    if (curBytes + b > limit) {
      parts.push(cur);
      cur = "";
      curBytes = 0;
      limit = 74;
    }
    cur += ch;
    curBytes += b;
  }
  if (cur) parts.push(cur);
  return parts.join("\r\n ");
}

/** Split "Mary Jane Smith" -> family "Smith", given "Mary Jane". Single word -> given only. */
export function splitName(name: string): { family: string; given: string } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { family: "", given: words[0] ?? "" };
  return { family: words[words.length - 1], given: words.slice(0, -1).join(" ") };
}

export function buildVCard(input: VCardInput): string {
  const url = permanentUrl(input.handle, input.siteUrl);
  const name = input.displayName.trim() || input.handle;
  const { family, given } = splitName(name);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeText(name)}`,
    `N:${escapeText(family)};${escapeText(given)};;;`,
  ];
  if (input.shareContact) {
    if (input.phone?.trim()) lines.push(`TEL;TYPE=CELL:${escapeText(input.phone.trim())}`);
    if (input.email?.trim()) lines.push(`EMAIL;TYPE=INTERNET:${escapeText(input.email.trim())}`);
  }
  lines.push(`URL:${url.replace(/[\r\n]/g, "")}`);
  lines.push(`NOTE:${escapeText(`My testimony: ${url}`)}`);
  lines.push("END:VCARD");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
