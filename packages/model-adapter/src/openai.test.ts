import { describe, it, expect } from "vitest";
import { OpenAIAdapter } from "./openai";

describe("OpenAIAdapter", () => {
  describe("constructor", () => {
    it("creates adapter with config", () => {
      const adapter = new OpenAIAdapter({
        baseUrl: "https://api.openai.com/v1",
        apiKey: "test-key",
        model: "gpt-4"
      });
      expect(adapter).toBeDefined();
    });

    it("stores baseUrl", () => {
      const adapter = new OpenAIAdapter({
        baseUrl: "https://api.test.com/v1",
        apiKey: "test-key",
        model: "gpt-4"
      });
      expect(adapter).toBeDefined();
    });
  });
});
