// #27: tell the operator a report arrived. Optional, best effort, and deliberately PII-free.
// Works with ntfy.sh (plain-text body + Title header) and generic webhooks that accept plain text.
// Sends only the page link, handle and time: never the reporter's text, IP, or story content.

const TIMEOUT_MS = 3000;

export interface ReportNotice {
  handle: string;
  reportedAt: Date;
  siteUrl?: string;
}

function siteOrigin(siteUrl?: string) {
  return (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** Only https webhooks are used (the alert names a page; keep it off plain http). */
export function isValidWebhookUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function buildReportMessage(n: ReportNotice) {
  const link = `${siteOrigin(n.siteUrl)}/@${n.handle}`;
  return {
    title: `RebirthAI report: @${n.handle}`,
    body: [`Page: ${link}`, `Reported: ${n.reportedAt.toISOString()}`].join("\n"),
  };
}

/** Never throws. Returns true when a notification was delivered. */
export async function notifyOperatorOfReport(
  n: ReportNotice,
  opts: { webhookUrl?: string; fetchImpl?: typeof fetch } = {},
): Promise<boolean> {
  const url = opts.webhookUrl ?? process.env.REPORT_WEBHOOK_URL;
  if (!url) return false;
  if (!isValidWebhookUrl(url)) {
    console.warn(JSON.stringify({ event: "report_notify_skipped", reason: "webhook_not_https" }));
    return false;
  }
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
