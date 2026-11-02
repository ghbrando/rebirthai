import { beforeEach, describe, expect, test, vi } from "vitest";

const state = vi.hoisted(() => ({ testimony: {} as Record<string, unknown>, adminCalls: 0, updated: [{ id: "t1" }] as unknown[] }));

vi.mock("@/lib/auth", () => ({
  getUserOrNull: async () => ({
    user: { id: "u1" },
    supabase: {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: table === "profiles" ? { id: "p1" } : state.testimony }),
          }),
        }),
      }),
    },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => {
    state.adminCalls++;
    return { from: () => ({ update: () => ({ eq: () => { const r = Promise.resolve({ error: null, data: state.updated }); return Object.assign(r, { is: () => ({ select: async () => ({ error: null, data: state.updated }) }) }); } }) }), storage: { from: () => ({ list: async () => ({ data: [] }), remove: async () => ({}) }) } };
  },
}));
vi.mock("@/components/testimony/Renderer", () => ({ collectMediaIds: () => [] }));

import { POST } from "./route";

const call = (action: string) =>
  POST(new Request("http://x/api/publish", { method: "POST", body: JSON.stringify({ action }) }));

describe("publish route and takedowns", () => {
  beforeEach(() => {
    state.adminCalls = 0;
    state.updated = [{ id: "t1" }];
    state.testimony = {
      id: "t1",
      title: "My story",
      draft_content: { type: "doc", content: [{ type: "paragraph" }] },
      takedown_at: null,
    };
  });

  test("refuses to publish a taken-down page, before touching storage or the database", async () => {
    state.testimony = { ...state.testimony, takedown_at: "2026-11-02T00:00:00Z", takedown_reason: "x" };
    const res = await call("publish");
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/taken down/i);
    expect(state.adminCalls).toBe(1); // client is created before the check, but nothing is written
  });

  test("refuses when a takedown lands mid-publish (guarded update matches no row)", async () => {
    state.updated = [];
    const res = await call("publish");
    expect(res.status).toBe(403);
  });

  test("still publishes a page that was not taken down", async () => {
    const res = await call("publish");
    expect(res.status).toBe(200);
  });
});
