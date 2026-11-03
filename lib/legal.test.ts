import { describe, expect, it } from "vitest";
import { LEGAL, LEGAL_DRAFT, isPlaceholder, unfilledPlaceholders } from "./legal";

describe("legal placeholders (#25)", () => {
  it("recognizes bracketed placeholders only", () => {
    expect(isPlaceholder("[CONTACT EMAIL]")).toBe(true);
    expect(isPlaceholder("  [EFFECTIVE DATE] ")).toBe(true);
    expect(isPlaceholder("hello@example.org")).toBe(false);
    expect(isPlaceholder("Jane [Doe]")).toBe(false);
  });

  it("lists unfilled keys", () => {
    expect(unfilledPlaceholders({ a: "[A]", b: "filled" })).toEqual(["a"]);
  });

  it("keeps the draft banner on while any placeholder is unfilled", () => {
    if (unfilledPlaceholders(LEGAL).length > 0) expect(LEGAL_DRAFT).toBe(true);
  });
});
