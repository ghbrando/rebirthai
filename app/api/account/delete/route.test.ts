import { beforeEach, describe, expect, test, vi } from "vitest";

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
      listFiles: async () => [],
      removeFiles: noop,
      deleteCoachMessages: noop,
      deleteMediaRows: noop,
      deleteTestimony: noop,
      deleteProfile: noop,
      deleteAuthUser: async (id: string) => {
        state.deletedFor.push(id);
      },
    };
  },
}));

import { POST } from "./route";

const req = (body: unknown) =>
  new Request("http://localhost/api/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    state.user = null;
    state.deletedFor = [];
    state.signOut.mockClear();
  });

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
});
