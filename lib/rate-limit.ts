// Small in-memory limiter for anonymous endpoints (best effort per server instance; the
// per-handle DB check in the report route is the durable backstop). The coach limit is a
// DB count per testimony, which does not fit anonymous callers, so this is separate.
const hits = new Map<string, number[]>();

/** True when `key` has used up `max` hits within `windowMs`; otherwise records this hit. */
export function rateLimited(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return false;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
