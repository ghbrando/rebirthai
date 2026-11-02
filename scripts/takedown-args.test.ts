import { describe, expect, test } from "vitest";
import { parseArgs, validateEnv } from "./takedown-args.mjs";

describe("takedown parseArgs", () => {
  test("take down needs a handle and a real reason", () => {
    expect(parseArgs([]).ok).toBe(false);
    expect(parseArgs(["maria_g"]).ok).toBe(false);
    expect(parseArgs(["maria_g", "bad"]).ok).toBe(false);
    const r = parseArgs(["@Maria_G", "Names a private person without consent", "--yes"]);
    expect(r).toMatchObject({ ok: true, handle: "maria_g", restore: false, yes: true });
  });
  test("without --yes it is a dry run", () => {
    expect(parseArgs(["maria_g", "Names a private person without consent"])).toMatchObject({ ok: true, yes: false });
  });
  test("restore takes no reason", () => {
    expect(parseArgs(["maria_g", "--restore"])).toMatchObject({ ok: true, restore: true, reason: null });
    expect(parseArgs(["maria_g", "some reason here", "--restore"]).ok).toBe(false);
  });
  test("rejects bad handles and unknown flags", () => {
    expect(parseArgs(["no!", "long enough reason"]).ok).toBe(false);
    expect(parseArgs(["maria_g", "--force"]).ok).toBe(false);
  });
});

describe("validateEnv", () => {
  test("needs URL and key", () => {
    expect(validateEnv({})).not.toBeNull();
    expect(validateEnv({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" })).toBeNull();
  });
});
