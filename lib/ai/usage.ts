// SERVER-ONLY. AI cost tracking (RC-08): one structured log line per AI call, so cost per
// testimony can be measured in the beta. Logs token counts only: never prompts, answers or names.

export type AiStep = "interview" | "draft" | "suggest";

export const DEFAULT_COACH_MODEL = "claude-opus-5-5";

// USD per million tokens (Anthropic list prices, cached 2026-10-06). Estimates only; the
// Anthropic Console is the bill of record. Cache writes are 1.25x input (5-minute TTL).
const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
  // Fallback targets (server-side refusal fallback); listed after the coach models so prefix
  // matching of dated IDs finds the longer name first.
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5 },
};

export const SUPPORTED_COACH_MODELS = Object.keys(PRICES);

/** Model for a coach step: env override (COACH_MODEL_INTERVIEW / _DRAFT / _SUGGEST) if supported, else the default. */
export function coachModel(step: AiStep, env: Record<string, string | undefined> = process.env): string {
  const v = env[`COACH_MODEL_${step.toUpperCase()}`]?.trim();
  return v && v in PRICES ? v : DEFAULT_COACH_MODEL;
}

export interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Price row for a model ID, including dated variants (e.g. "claude-opus-5-5-2026..."). */
function priceFor(model: string) {
  return PRICES[model] ?? Object.entries(PRICES).find(([k]) => model.startsWith(k))?.[1];
}

export function estimateCostUsd(model: string, u: UsageLike): number | null {
  const p = priceFor(model);
  if (!p) return null;
  const read = u.cache_read_input_tokens ?? 0;
  const write = u.cache_creation_input_tokens ?? 0;
  const usd =
    (u.input_tokens * p.input + write * p.input * 1.25 + read * p.cacheRead + u.output_tokens * p.output) / 1e6;
  return Math.round(usd * 1e6) / 1e6;
}

/**
 * One JSON line per AI call; aggregate by testimony_id for cost per testimony.
 * `servedModel` is the model that answered (a fallback can differ from the one requested).
 * `usage: null` records a call that failed before usage was known (counted, cost unknown).
 */
export function logAiUsage(
  step: AiStep,
  requestedModel: string,
  servedModel: string | null,
  usage: UsageLike | null,
  testimonyId: string,
): void {
  console.log(
    JSON.stringify({
      event: "ai_usage",
      step,
      model: servedModel ?? requestedModel,
      requested_model: requestedModel,
      testimony_id: testimonyId,
      failed: usage === null,
      input_tokens: usage?.input_tokens ?? null,
      output_tokens: usage?.output_tokens ?? null,
      cache_read_tokens: usage ? (usage.cache_read_input_tokens ?? 0) : null,
      cache_write_tokens: usage ? (usage.cache_creation_input_tokens ?? 0) : null,
      est_usd: usage ? estimateCostUsd(servedModel ?? requestedModel, usage) : null,
    }),
  );
}
