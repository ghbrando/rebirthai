import { describe, expect, test, vi } from "vitest";
import { buildReportMessage, isValidWebhookUrl, notifyOperatorOfReport } from "./report-notify";

const notice = {
  handle: "maria_g",
  reportedAt: new Date("2026-11-02T10:00:00Z"),
  siteUrl: "https://rebirth.example/",
};

describe("buildReportMessage", () => {
  test("has only the page link, handle and time", () => {
    const { title, body } = buildReportMessage(notice);
    expect(title).toBe("RebirthAI report: @maria_g");
    expect(body).toBe("Page: https://rebirth.example/@maria_g\nReported: 2026-11-02T10:00:00.000Z");
  });
});

describe("isValidWebhookUrl", () => {
  test("requires https", () => {
    expect(isValidWebhookUrl("https://ntfy.sh/t")).toBe(true);
    expect(isValidWebhookUrl("http://ntfy.sh/t")).toBe(false);
    expect(isValidWebhookUrl("nonsense")).toBe(false);
    expect(isValidWebhookUrl(undefined)).toBe(false);
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
  test("does nothing without a webhook URL, or with a non-https one", async () => {
    const fetchImpl = vi.fn();
    vi.stubEnv("REPORT_WEBHOOK_URL", "");
    expect(await notifyOperatorOfReport(notice, { fetchImpl })).toBe(false);
    vi.unstubAllEnvs();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await notifyOperatorOfReport(notice, { webhookUrl: "http://x.test", fetchImpl })).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    warn.mockRestore();
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
