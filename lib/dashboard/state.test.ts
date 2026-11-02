import { describe, expect, it } from "vitest";
import { dashboardCopy, deriveDashboardState, type DashboardInput } from "./state";

const empty = { type: "doc", content: [] } as never;
const withText = { type: "doc", content: [{ type: "paragraph" }] } as never;
const t = (o: Partial<NonNullable<DashboardInput["testimony"]>> = {}) => ({
  status: "draft" as const,
  visibility: "public" as const,
  title: "",
  draft_content: empty,
  published_at: null,
  ...o,
});

describe("deriveDashboardState", () => {
  it("not started: no row", () => {
    expect(deriveDashboardState({ testimony: null, coachMessageCount: 0 })).toBe("not_started");
  });
  it("not started: empty draft, no messages", () => {
    expect(deriveDashboardState({ testimony: t(), coachMessageCount: 0 })).toBe("not_started");
  });
  it("draft in progress: coach messages only", () => {
    expect(deriveDashboardState({ testimony: t(), coachMessageCount: 2 })).toBe("draft_in_progress");
  });
  it("draft in progress: draft content only", () => {
    expect(deriveDashboardState({ testimony: t({ draft_content: withText }), coachMessageCount: 0 })).toBe(
      "draft_in_progress",
    );
  });
  it("published public / unlisted", () => {
    const p = { status: "published" as const, published_at: "2026-11-01" };
    expect(deriveDashboardState({ testimony: t(p), coachMessageCount: 0 })).toBe("published_public");
    expect(deriveDashboardState({ testimony: t({ ...p, visibility: "unlisted" }), coachMessageCount: 5 })).toBe(
      "published_unlisted",
    );
  });
  it("unpublished", () => {
    expect(
      deriveDashboardState({ testimony: t({ status: "unpublished", published_at: "2026-11-01" }), coachMessageCount: 0 }),
    ).toBe("unpublished");
  });
});

describe("dashboardCopy", () => {
  it("uses /@handle and never implementation words", () => {
    const states = ["not_started", "draft_in_progress", "published_public", "published_unlisted", "unpublished"] as const;
    for (const s of states) {
      const text = JSON.stringify(dashboardCopy(s, "mary", true));
      expect(text).not.toMatch(/\/u\/|visibility|status|draft_content|Screen/i);
    }
    expect(dashboardCopy("published_public", "mary").primary.href).toBe("/@mary");
  });
  it("draft with no content sends to the coach", () => {
    expect(dashboardCopy("draft_in_progress", "m", false).primary.href).toBe("/coach");
    expect(dashboardCopy("draft_in_progress", "m", true).primary.href).toBe("/editor");
  });
});
