import { describe, expect, test, vi } from "vitest";
import { coachModel, DEFAULT_COACH_MODEL, estimateCostUsd, logAiUsage } from "./usage";

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

describe("cost and logging edge cases", () => {
  test("prices dated model IDs and the suggest step default", () => {
    expect(estimateCostUsd("claude-opus-5-5-20261001", { input_tokens: 1e6, output_tokens: 0 })).toBeCloseTo(4, 6);
    expect(coachModel("suggest", {})).toBe(DEFAULT_COACH_MODEL);
  });
  test("treats null cache counts as zero", () => {
    expect(estimateCostUsd("claude-opus-5-5", { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: null })).toBe(0);
  });
  test("log line carries counts only; failed calls are counted with unknown cost", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logAiUsage("draft", "claude-opus-5-5", "claude-opus-5", { input_tokens: 10, output_tokens: 5 }, "t1");
    logAiUsage("interview", "claude-opus-5-5", null, null, "t1");
    const [ok, failed] = spy.mock.calls.map((c) => JSON.parse(String(c[0])));
    spy.mockRestore();
    expect(Object.keys(ok).sort()).toEqual(
      ["cache_read_tokens", "cache_write_tokens", "est_usd", "event", "failed", "input_tokens", "model", "output_tokens", "requested_model", "step", "testimony_id"],
    );
    expect(ok).toMatchObject({ model: "claude-opus-5", requested_model: "claude-opus-5-5", failed: false });
    expect(failed).toMatchObject({ model: "claude-opus-5-5", failed: true, input_tokens: null, est_usd: null });
  });
});
