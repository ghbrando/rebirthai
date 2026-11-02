// #27: tell the operator a report arrived. Optional, best effort, and deliberately PII-free.
// Works with ntfy.sh (plain-text body + Title header) and generic webhooks that accept plain text.

const EXCERPT_MAX = 80;
const TIMEOUT_MS = 3000;

export interface ReportNotice {
  handle: string;
  reason: string; // the reporter's free text; only a short excerpt is ever sent
  reportedAt: Date;
  siteUrl?: string;
}

function siteOrigin(siteUrl?: string) {
  return (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** Keeps the first line, collapses whitespace, strips link-like text, truncates. Never the full report. */
export function reasonExcerpt(reason: string): string {
  const oneLine = reason.replace(/https?:\/\/\S+/gi, "[link]").replace(/\s+/g, " ").trim();
  return oneLine.length > EXCERPT_MAX ? `${oneLine.slice(0, EXCERPT_MAX - 1)}…` : oneLine;
}

/** The message text and title. No reporter IP, no story text, no full report. */
export function buildReportMessage(n: ReportNotice) {
  const link = `${siteOrigin(n.siteUrl)}/@${n.handle}`;
  return {
    title: `RebirthAI report: @${n.handle}`,
    body: [`Page: ${link}`, `Reason: ${reasonExcerpt(n.reason)}`, `Reported: ${n.reportedAt.toISOString()}`].join("\n"),
  };
}

/** Never throws. Returns true when a notification was delivered. */
export async function notifyOperatorOfReport(
  n: ReportNotice,
  opts: { webhookUrl?: string; fetchImpl?: typeof fetch } = {},
): Promise<boolean> {
  const url = opts.webhookUrl ?? process.env.REPORT_WEBHOOK_URL;
  if (!url) return false;
  const { title, body } = buildReportMessage(n);
  try {
    const res = await (opts.fetchImpl ?? fetch)(url, {
      method: "POST",
      headers: { "content-type": "text/plain; charset=utf-8", Title: title },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(JSON.stringify({ event: "report_notify_failed", status: res.status }));
      return false;
    }
    return true;
  } catch (e) {
    console.warn(JSON.stringify({ event: "report_notify_failed", error: e instanceof Error ? e.name : "unknown" }));
    return false;
  }
}
