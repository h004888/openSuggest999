import { describe, it, expect } from "vitest";
import { OpenAIAdapter } from "./openaiAdapter";

describe("OpenAIAdapter", () => {
  describe("import", () => {
    it("exports OpenAIAdapter from model-adapter", () => {
      // This tests the re-export
      expect(OpenAIAdapter).toBeDefined();
    });
  });
});
