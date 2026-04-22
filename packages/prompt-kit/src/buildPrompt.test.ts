import { describe, it, expect } from "vitest";
import { buildPrompt } from "./buildPrompt";

describe("buildPrompt", () => {
  it("generates completion prompt for TypeScript", () => {
    const result = buildPrompt({
      language: "typescript",
      filePath: "test.ts",
      prefix: "const hello",
      suffix: "",
      cursor: { line: 0, character: 11 }
    });

    expect(result.systemPrompt).toContain("TypeScript");
    expect(result.userPrompt).toContain("Language: typescript");
    expect(result.userPrompt).toContain("File: test.ts");
  });

  it("handles Python language", () => {
    const result = buildPrompt({
      language: "python",
      filePath: "test.py",
      prefix: "def hello",
      suffix: "",
      cursor: { line: 0, character: 9 }
    });

    expect(result.systemPrompt).toContain("PEP 8");
    expect(result.userPrompt).toContain("Language: python");
  });

  it("handles Go language", () => {
    const result = buildPrompt({
      language: "go",
      filePath: "main.go",
      prefix: "func main()",
      suffix: "",
      cursor: { line: 0, character: 10 }
    });

    expect(result.systemPrompt).toContain("Go idioms");
    expect(result.userPrompt).toContain("Language: go");
  });

  it("includes context for Rust", () => {
    const result = buildPrompt({
      language: "rust",
      filePath: "lib.rs",
      prefix: "fn main()",
      suffix: "}",
      cursor: { line: 0, character: 8 }
    });

    expect(result.systemPrompt).toContain("Rust idioms");
    expect(result.userPrompt).toContain("Language: rust");
  });

  it("handles JavaScript", () => {
    const result = buildPrompt({
      language: "javascript",
      filePath: "index.js",
      prefix: "const x = ",
      suffix: "",
      cursor: { line: 0, character: 9 }
    });

    expect(result.systemPrompt).toContain("JavaScript");
    expect(result.userPrompt).toContain("Language: javascript");
  });

  it("returns system and user prompts separately", () => {
    const result = buildPrompt({
      language: "typescript",
      filePath: "test.ts",
      prefix: "const hello",
      suffix: ";",
      cursor: { line: 0, character: 11 }
    });

    expect(result.systemPrompt).toBeDefined();
    expect(result.userPrompt).toBeDefined();
    expect(result.systemPrompt).not.toBe(result.userPrompt);
  });

  it("includes PREFIX and SUFFIX markers in user prompt", () => {
    const result = buildPrompt({
      language: "typescript",
      filePath: "test.ts",
      prefix: "const hello",
      suffix: ";",
      cursor: { line: 0, character: 11 }
    });

    expect(result.userPrompt).toContain("<PREFIX>");
    expect(result.userPrompt).toContain("const hello");
    expect(result.userPrompt).toContain("</PREFIX>");
    expect(result.userPrompt).toContain("<SUFFIX>");
    expect(result.userPrompt).toContain(";");
    expect(result.userPrompt).toContain("</SUFFIX>");
  });

  it("handles unknown language with default hints", () => {
    const result = buildPrompt({
      language: "unknownlang",
      filePath: "test.xyz",
      prefix: "test",
      suffix: "",
      cursor: { line: 0, character: 4 }
    });

    expect(result.systemPrompt).toContain("conventions");
  });
});
