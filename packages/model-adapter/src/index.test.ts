import { describe, expect, it, vi } from "vitest";
import { OpenAIAdapter } from "./openai.js";
import { createAdapter } from "./index.js";

describe("createAdapter", () => {
  it("falls back to secondary model when primary fails", async () => {
    const completeSpy = vi
      .spyOn(OpenAIAdapter.prototype, "complete")
      .mockRejectedValueOnce(new Error("primary error"))
      .mockResolvedValueOnce({
        suggestion: "return ok;",
        model: "MiniMax-M2.5",
        stopReason: "stop"
      });

    const adapter = createAdapter({
      apiKey: "k",
      model: "MiniMax-M2.7",
      fallbackModel: "MiniMax-M2.5",
      baseUrl: "https://api.minimax.io/v1"
    });

    const response = await adapter.complete({
      systemPrompt: "sys",
      userPrompt: "usr",
      maxTokens: 80,
      temperature: 0.2
    });

    expect(completeSpy).toHaveBeenCalledTimes(2);
    expect(response.suggestion).toBe("return ok;");
    expect(response.model).toBe("MiniMax-M2.5");

    completeSpy.mockRestore();
  });
});
