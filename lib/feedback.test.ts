import { describe, expect, it } from "vitest";
import { getFeedbackUrl } from "./feedback";

describe("getFeedbackUrl", () => {
  it("hides the link when unset or blank", () => {
    expect(getFeedbackUrl(undefined)).toBeNull();
    expect(getFeedbackUrl("   ")).toBeNull();
  });
  it("accepts a form link or a mailto link, trimmed", () => {
    expect(getFeedbackUrl(" https://forms.gle/abc ")).toBe("https://forms.gle/abc");
    expect(getFeedbackUrl("mailto:beta@example.com?subject=Feedback")).toBe(
      "mailto:beta@example.com?subject=Feedback",
    );
  });
  it("rejects anything else", () => {
    expect(getFeedbackUrl("javascript:alert(1)")).toBeNull();
    expect(getFeedbackUrl("not a url")).toBeNull();
  });
});
