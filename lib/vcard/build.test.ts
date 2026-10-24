import { describe, expect, it } from "vitest";
import { buildVCard, escapeText, foldLine, splitName } from "./build";

const base = { displayName: "Mary Jane Smith", handle: "mary_s", siteUrl: "https://x.test" };
const unfold = (s: string) => s.replace(/\r\n /g, "");

describe("vcard", () => {
  it("escapes backslash, comma, semicolon, newline", () => {
    expect(escapeText("a\\b,c;d\ne")).toBe("a\\\\b\\,c\\;d\\ne");
  });

  it("uses CRLF and required structure", () => {
    const v = buildVCard(base);
    expect(v.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(v.endsWith("END:VCARD\r\n")).toBe(true);
    expect(v.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(v).not.toMatch(/PHOTO/);
  });

  it("includes permanent URL and note", () => {
    const v = buildVCard(base);
    expect(v).toContain("URL:https://x.test/@mary_s\r\n");
    expect(v).toContain("NOTE:My testimony: https://x.test/@mary_s");
  });

  it("N/FN for multi-word and single-word names", () => {
    const m = buildVCard(base);
    expect(m).toContain("FN:Mary Jane Smith");
    expect(m).toContain("N:Smith;Mary Jane;;;");
    expect(splitName("Grace")).toEqual({ family: "", given: "Grace" });
    expect(buildVCard({ ...base, displayName: "Grace" })).toContain("N:;Grace;;;");
  });

  it("omits phone/email unless opted in", () => {
    const data = { ...base, phone: "+1 555 0100", email: "a@b.co" };
    const off = buildVCard({ ...data, shareContact: false });
    expect(off).not.toMatch(/TEL|EMAIL|555|a@b\.co/);
    const on = buildVCard({ ...data, shareContact: true });
    expect(on).toContain("TEL;TYPE=CELL:+1 555 0100");
    expect(on).toContain("EMAIL;TYPE=INTERNET:a@b.co");
    const noPhone = buildVCard({ ...data, phone: "", shareContact: true });
    expect(noPhone).not.toContain("TEL");
  });

  it("folds at 75 octets on UTF-8 boundaries", () => {
    const long = "NOTE:" + "é漢😀".repeat(30);
    const folded = foldLine(long);
    const lines = folded.split("\r\n");
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    for (const l of lines.slice(1)) expect(l.startsWith(" ")).toBe(true);
    expect(unfold(folded)).toBe(long);
    expect(foldLine("short")).toBe("short");
  });

  it("folds long names in a full card and round-trips", () => {
    const name = "Ñandú ".repeat(30).trim();
    const v = buildVCard({ ...base, displayName: name });
    for (const l of v.split("\r\n")) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(unfold(v)).toContain(`FN:${name}`);
  });
});
