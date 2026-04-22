import { describe, expect, it } from "vitest";
import {
  InlineCompletionRequestSchema,
  InlineCompletionResponseSchema
} from "./inlineCompletion.js";

describe("InlineCompletion schemas", () => {
  it("accepts valid request payload", () => {
    const result = InlineCompletionRequestSchema.safeParse({
      language: "typescript",
      filePath: "src/app.ts",
      cursor: { line: 12, character: 8 },
      prefix: "const a = ",
      suffix: "\n",
      editor: "vscode",
      requestId: "req-1"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid request payload", () => {
    const result = InlineCompletionRequestSchema.safeParse({
      language: "",
      filePath: "",
      cursor: { line: -1, character: 0 },
      prefix: "x",
      suffix: "y"
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid response payload", () => {
    const result = InlineCompletionResponseSchema.safeParse({
      suggestion: "return user;",
      model: "MiniMax-M2.7",
      latencyMs: 120,
      cached: false
    });

    expect(result.success).toBe(true);
  });

  it("rejects response with negative latency", () => {
    const result = InlineCompletionResponseSchema.safeParse({
      suggestion: "return user;",
      model: "MiniMax-M2.7",
      latencyMs: -1,
      cached: false
    });

    expect(result.success).toBe(false);
  });
});
