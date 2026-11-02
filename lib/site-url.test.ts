import { describe, it, expect } from "vitest";
import { getSiteUrl } from "./site-url";

const prod = { NODE_ENV: "production" };

describe("getSiteUrl", () => {
  it("local dev defaults to localhost", () => {
    expect(getSiteUrl({ NODE_ENV: "development" })).toBe("http://localhost:3000");
    expect(getSiteUrl({})).toBe("http://localhost:3000");
  });
  it("local dev honours NEXT_PUBLIC_SITE_URL and trims slashes", () => {
    expect(getSiteUrl({ NODE_ENV: "development", NEXT_PUBLIC_SITE_URL: "http://localhost:4000/" })).toBe("http://localhost:4000");
  });
  it("production (Vercel) returns the real address", () => {
    expect(getSiteUrl({ ...prod, VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://rebirth.example/" })).toBe("https://rebirth.example");
  });
  it("production build without a Vercel env returns the real address", () => {
    expect(getSiteUrl({ ...prod, NEXT_PUBLIC_SITE_URL: "https://rebirth.example" })).toBe("https://rebirth.example");
  });
  it("production throws when missing", () => {
    expect(() => getSiteUrl({ ...prod, VERCEL_ENV: "production" })).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
    expect(() => getSiteUrl(prod)).toThrow(/not set/);
    expect(() => getSiteUrl({ ...prod, NEXT_PUBLIC_SITE_URL: "  " })).toThrow(/not set/);
  });
  it("production does not fall back to VERCEL_URL", () => {
    expect(() => getSiteUrl({ ...prod, VERCEL_ENV: "production", VERCEL_URL: "x.vercel.app" })).toThrow();
  });
  it.each(["http://localhost:3000", "http://127.0.0.1:3000", "https://my-app.vercel.app", "not a url"])(
    "production throws for test address %s",
    (u) => {
      expect(() => getSiteUrl({ ...prod, VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: u })).toThrow(/test address/);
      expect(() => getSiteUrl({ ...prod, NEXT_PUBLIC_SITE_URL: u })).toThrow(/test address/);
    },
  );
  it("preview falls back to VERCEL_URL", () => {
    expect(getSiteUrl({ ...prod, VERCEL_ENV: "preview", VERCEL_URL: "app-git-x.vercel.app" })).toBe("https://app-git-x.vercel.app");
  });
  it("preview prefers a non-local NEXT_PUBLIC_SITE_URL, ignores localhost", () => {
    expect(getSiteUrl({ ...prod, VERCEL_ENV: "preview", NEXT_PUBLIC_SITE_URL: "https://staging.example", VERCEL_URL: "a.vercel.app" })).toBe("https://staging.example");
    expect(getSiteUrl({ ...prod, VERCEL_ENV: "preview", NEXT_PUBLIC_SITE_URL: "http://localhost:3000", VERCEL_URL: "a.vercel.app" })).toBe("https://a.vercel.app");
  });
  it("preview with nothing usable throws", () => {
    expect(() => getSiteUrl({ ...prod, VERCEL_ENV: "preview" })).toThrow();
  });
});
