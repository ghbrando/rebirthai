import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  deletedFor: [] as string[],
  signOut: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/lib/auth", () => ({
  getUserOrNull: async () =>
    state.user ? { user: state.user, supabase: { auth: { signOut: state.signOut } } } : null,
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: () => ({}) }));
vi.mock("@/lib/account/supabase-ports", () => ({
  supabaseDeletionPorts: () => {
    const noop = async () => {};
    return {
      findOwnRows: async () => ({ profileId: null, testimonyId: null }),
      unpublishTestimony: noop,
      isPublished: async () => false,
      listFiles: async () => [],
      removeFiles: noop,
      deleteAuthUser: async (id: string) => {
        state.deletedFor.push(id);
      },
    };
  },
}));

import { POST } from "./route";

const req = (
  body: unknown,
  { origin = "http://localhost:3000", type = "application/json" }: { origin?: string | null; type?: string } = {},
) => {
  const headers: Record<string, string> = { "Content-Type": type, host: "localhost:3000" };
  if (origin) headers.origin = origin;
  return new Request("http://localhost:3000/api/account/delete", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
};

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    state.user = null;
    state.deletedFor = [];
    state.signOut.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  test("refuses when not signed in", async () => {
    const res = await POST(req({ confirm: "DELETE" }));
    expect(res.status).toBe(401);
    expect(state.deletedFor).toEqual([]);
  });

  test("requires the typed confirmation", async () => {
    state.user = { id: ME };
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ confirm: "delete" }))).status).toBe(400);
    expect(state.deletedFor).toEqual([]);
  });

  test("deletes only the signed-in user, ignoring any id in the request", async () => {
    state.user = { id: ME };
    const res = await POST(req({ confirm: "DELETE", userId: OTHER }));
    expect(res.status).toBe(200);
    expect(state.deletedFor).toEqual([ME]);
    expect(state.signOut).toHaveBeenCalledOnce();
  });

  describe("cross-site request protection", () => {
    beforeEach(() => {
      state.user = { id: ME };
    });

    test("rejects a request from another site", async () => {
      expect((await POST(req({ confirm: "DELETE" }, { origin: "https://evil.example" }))).status).toBe(403);
      expect(state.deletedFor).toEqual([]);
    });

    test("rejects a request without an Origin header", async () => {
      expect((await POST(req({ confirm: "DELETE" }, { origin: null }))).status).toBe(403);
      expect(state.deletedFor).toEqual([]);
    });

    test("rejects a malformed Origin", async () => {
      expect((await POST(req({ confirm: "DELETE" }, { origin: "null" }))).status).toBe(403);
    });

    test("rejects a form post (not JSON)", async () => {
      const res = await POST(req("confirm=DELETE", { type: "application/x-www-form-urlencoded" }));
      expect(res.status).toBe(415);
      expect(state.deletedFor).toEqual([]);
    });

    test("accepts the configured site URL as origin", async () => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://rebirth.example");
      const res = await POST(req({ confirm: "DELETE" }, { origin: "https://rebirth.example" }));
      expect(res.status).toBe(200);
      expect(state.deletedFor).toEqual([ME]);
    });
  });
});
