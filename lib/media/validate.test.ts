import { describe, expect, it } from "vitest";
import { checkStoredMedia, MISSING_PHOTO_DESCRIPTION } from "./validate";

const MB = 1024 * 1024;

describe("checkStoredMedia (publish-time check)", () => {
  it("accepts allowed stored files with descriptions", () => {
    expect(checkStoredMedia({ kind: "image", alt_text: "Me at church" }, { size: 2 * MB, contentType: "image/jpeg" })).toBeNull();
    expect(checkStoredMedia({ kind: "video", alt_text: null }, { size: 90 * MB, contentType: "video/mp4" })).toBeNull();
  });
  it("refuses a photo without a description", () => {
    expect(checkStoredMedia({ kind: "image", alt_text: "  " }, { size: 1, contentType: "image/png" })).toBe(
      MISSING_PHOTO_DESCRIPTION,
    );
  });
  it("refuses a stored type that is not allowed or does not match the kind", () => {
    expect(checkStoredMedia({ kind: "video", alt_text: "x" }, { size: MB, contentType: "text/html" })).toMatch(/can't be published/);
    expect(checkStoredMedia({ kind: "image", alt_text: "x" }, { size: MB, contentType: "video/mp4" })).toMatch(/can't be published/);
  });
  it("refuses files over the limit and missing files", () => {
    expect(checkStoredMedia({ kind: "video", alt_text: "x" }, { size: 101 * MB, contentType: "video/mp4" })).toMatch(/100 MB/);
    expect(checkStoredMedia({ kind: "image", alt_text: "x" }, { size: 11 * MB, contentType: "image/webp" })).toMatch(/10 MB/);
    expect(checkStoredMedia({ kind: "video", alt_text: "x" }, null)).toMatch(/could not be found/);
  });
});
