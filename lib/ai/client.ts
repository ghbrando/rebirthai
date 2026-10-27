import Anthropic from "@anthropic-ai/sdk";

// SERVER-ONLY (RC-07, DD-07): never import into client components.
// (The `server-only` package is not installed; keep this import out of "use client" trees.)
// Models per coach step: lib/ai/usage.ts (coachModel), overridable by COACH_MODEL_<STEP> env vars.

let _client: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return (_client ??= new Anthropic());
}

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);
