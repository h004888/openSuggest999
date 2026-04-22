import { describe, expect, it } from "vitest";
import { sanitizeSuggestion } from "./sanitizeSuggestion";

describe("sanitizeSuggestion", () => {
  it("removes markdown code fences", () => {
    const output = sanitizeSuggestion("```ts\nreturn 1;\n```");
    expect(output).toBe("return 1;");
  });

  it("returns empty string for whitespace", () => {
    expect(sanitizeSuggestion("   \n  ")).toBe("");
  });

  it("removes think blocks and keeps code", () => {
    const output = sanitizeSuggestion("<think>reasoning</think>\n\nreturn 42;");
    expect(output).toBe("return 42;");
  });

  it("extracts the first fenced code block", () => {
    const output = sanitizeSuggestion("Here is the code:\n```ts\nconst x = 1;\nreturn x;\n```\n");
    expect(output).toBe("const x = 1;\nreturn x;");
  });
});
