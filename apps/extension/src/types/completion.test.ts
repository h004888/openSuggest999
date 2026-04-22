import { describe, it, expect } from "vitest";
import { isInlineCompletionResponse, type InlineCompletionResponse } from "./completion";

describe("isInlineCompletionResponse", () => {
  it("returns true for valid response", () => {
    const response: InlineCompletionResponse = {
      suggestion: " test code",
      model: "gpt-4",
      latencyMs: 100,
      cached: false
    };
    expect(isInlineCompletionResponse(response)).toBe(true);
  });

  it("returns true for valid response with stopReason", () => {
    const response: InlineCompletionResponse = {
      suggestion: " test code",
      model: "gpt-4",
      latencyMs: 100,
      cached: false,
      stopReason: "stop"
    };
    expect(isInlineCompletionResponse(response)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isInlineCompletionResponse(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isInlineCompletionResponse(undefined)).toBe(false);
  });

  it("returns false for array", () => {
    expect(isInlineCompletionResponse([])).toBe(false);
  });

  it("returns false for primitive string", () => {
    expect(isInlineCompletionResponse("string")).toBe(false);
  });

  it("returns false when suggestion is missing", () => {
    expect(isInlineCompletionResponse({
      model: "gpt-4",
      latencyMs: 100,
      cached: false
    })).toBe(false);
  });

  it("returns false when model is missing", () => {
    expect(isInlineCompletionResponse({
      suggestion: " test",
      latencyMs: 100,
      cached: false
    })).toBe(false);
  });

  it("returns false when latencyMs is missing", () => {
    expect(isInlineCompletionResponse({
      suggestion: " test",
      model: "gpt-4",
      cached: false
    })).toBe(false);
  });

  it("returns false when latencyMs is NaN", () => {
    expect(isInlineCompletionResponse({
      suggestion: " test",
      model: "gpt-4",
      latencyMs: NaN,
      cached: false
    })).toBe(false);
  });

  it("returns false when cached is missing", () => {
    expect(isInlineCompletionResponse({
      suggestion: " test",
      model: "gpt-4",
      latencyMs: 100
    })).toBe(false);
  });

  it("returns false when suggestion is not a string", () => {
    expect(isInlineCompletionResponse({
      suggestion: 123,
      model: "gpt-4",
      latencyMs: 100,
      cached: false
    })).toBe(false);
  });

  it("returns false when model is not a string", () => {
    expect(isInlineCompletionResponse({
      suggestion: " test",
      model: 123,
      latencyMs: 100,
      cached: false
    })).toBe(false);
  });

  it("returns true for object with extra properties", () => {
    expect(isInlineCompletionResponse({
      suggestion: " test",
      model: "gpt-4",
      latencyMs: 100,
      cached: false,
      extra: "property"
    })).toBe(true);
  });
});
