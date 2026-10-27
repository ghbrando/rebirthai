import { describe, expect, test } from "vitest";
import { coachModel, DEFAULT_COACH_MODEL, estimateCostUsd } from "./usage";

describe("coachModel", () => {
  test("defaults to the top model for every step", () => {
    expect(coachModel("interview", {})).toBe(DEFAULT_COACH_MODEL);
    expect(coachModel("draft", {})).toBe(DEFAULT_COACH_MODEL);
  });
  test("uses a supported per-step override", () => {
    expect(coachModel("interview", { COACH_MODEL_INTERVIEW: "claude-sonnet-5-5" })).toBe("claude-sonnet-5-5");
    expect(coachModel("draft", { COACH_MODEL_INTERVIEW: "claude-sonnet-5-5" })).toBe(DEFAULT_COACH_MODEL);
  });
  test("ignores unknown or misspelled models", () => {
    expect(coachModel("interview", { COACH_MODEL_INTERVIEW: "claude-sonet" })).toBe(DEFAULT_COACH_MODEL);
  });
});

describe("estimateCostUsd", () => {
  test("prices input, output and cache tokens", () => {
    // 1M input @4 + 1M output @20 + 1M cache read @0.2 + 1M cache write @5
    const usd = estimateCostUsd("claude-opus-5-5", {
      input_tokens: 1e6,
      output_tokens: 1e6,
      cache_read_input_tokens: 1e6,
      cache_creation_input_tokens: 1e6,
    });
    expect(usd).toBeCloseTo(29.2, 6);
  });
  test("returns null for unknown models", () => {
    expect(estimateCostUsd("other", { input_tokens: 1, output_tokens: 1 })).toBeNull();
  });
});
