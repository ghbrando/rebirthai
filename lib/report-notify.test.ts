import { describe, expect, test, vi } from "vitest";
import { buildReportMessage, notifyOperatorOfReport, reasonExcerpt } from "./report-notify";

const notice = {
  handle: "maria_g",
  reason: "This names my brother without permission. See https://example.com/secret?token=abc\nand more " + "x".repeat(300),
  reportedAt: new Date("2026-11-02T10:00:00Z"),
  siteUrl: "https://rebirth.example/",
};

describe("buildReportMessage", () => {
  test("has the page link, a short excerpt and the time, and nothing else", () => {
    const { title, body } = buildReportMessage(notice);
    expect(title).toBe("RebirthAI report: @maria_g");
    expect(body).toContain("Page: https://rebirth.example/@maria_g");
    expect(body).toContain("Reported: 2026-11-02T10:00:00.000Z");
    expect(body).not.toContain("token=abc");
    expect(body).not.toContain("x".repeat(100));
    expect(body.split("\n")).toHaveLength(3);
  });
  test("excerpt is single-line and truncated", () => {
    const e = reasonExcerpt(notice.reason);
    expect(e.length).toBeLessThanOrEqual(80);
    expect(e).not.toContain("\n");
  });
});

describe("notifyOperatorOfReport", () => {
  test("posts plain text with a Title header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const ok = await notifyOperatorOfReport(notice, { webhookUrl: "https://ntfy.sh/topic", fetchImpl });
    expect(ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://ntfy.sh/topic");
    expect(init.method).toBe("POST");
    expect(init.headers.Title).toBe("RebirthAI report: @maria_g");
    expect(init.signal).toBeDefined();
  });
  test("does nothing without a webhook URL", async () => {
    const fetchImpl = vi.fn();
    vi.stubEnv("REPORT_WEBHOOK_URL", "");
    expect(await notifyOperatorOfReport(notice, { fetchImpl })).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
  test("tolerates network failure and bad status, logging without PII", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const boom = vi.fn().mockRejectedValue(new Error("secret token abc"));
    expect(await notifyOperatorOfReport(notice, { webhookUrl: "https://x.test", fetchImpl: boom })).toBe(false);
    const bad = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    expect(await notifyOperatorOfReport(notice, { webhookUrl: "https://x.test", fetchImpl: bad })).toBe(false);
    const logged = warn.mock.calls.map((c) => String(c[0])).join("");
    expect(logged).toContain("report_notify_failed");
    expect(logged).not.toContain("maria_g");
    expect(logged).not.toContain("secret token");
    warn.mockRestore();
  });
});
