import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompletionService, normalizeInlineSuggestion } from "./completionService";
import type { CompletionModelAdapter } from "@opensuggest/model-adapter";
import { CacheService } from "./cacheService";
import { TelemetryService } from "./telemetryService";

describe("CompletionService", () => {
  let mockAdapter: CompletionModelAdapter;
  let cache: CacheService<any>;
  let telemetry: TelemetryService;
  let service: CompletionService;

  beforeEach(() => {
    mockAdapter = {
      complete: vi.fn().mockResolvedValue({
        suggestion: " test suggestion",
        stopReason: "stop",
        model: "test-model"
      })
    };
    cache = new CacheService<any>({ ttlMs: 30000 });
    telemetry = new TelemetryService({ enabled: false });
    service = new CompletionService({
      adapter: mockAdapter,
      cache,
      telemetry,
      modelName: "test-model"
    });
  });

  describe("complete", () => {
    it("returns cached result when available", async () => {
      const request = {
        language: "typescript",
        filePath: "test.ts",
        cursor: { line: 0, character: 10 },
        prefix: "const hello",
        suffix: ";"
      };

      await service.complete(request);
      const result = await service.complete(request);

      expect(result.cached).toBe(true);
    });

    it("calls adapter on cache miss", async () => {
      const request = {
        language: "typescript",
        filePath: "test.ts",
        cursor: { line: 0, character: 10 },
        prefix: "const hello",
        suffix: ";"
      };

      await service.complete(request);

      expect(mockAdapter.complete).toHaveBeenCalledTimes(1);
    });

    it("uses model name from adapter result when available", async () => {
      mockAdapter.complete = vi.fn().mockResolvedValue({
        suggestion: " test",
        stopReason: "stop",
        model: "override-model"
      });

      const result = await service.complete({
        language: "typescript",
        filePath: "test.ts",
        cursor: { line: 0, character: 10 },
        prefix: "const hello",
        suffix: ";"
      });

      expect(result.model).toBe("override-model");
    });

    it("falls back to configured model name", async () => {
      mockAdapter.complete = vi.fn().mockResolvedValue({
        suggestion: " test",
        stopReason: "stop"
      });

      const result = await service.complete({
        language: "typescript",
        filePath: "test.ts",
        cursor: { line: 0, character: 10 },
        prefix: "const hello",
        suffix: ";"
      });

      expect(result.model).toBe("test-model");
    });

    it("uses inline-friendly model parameters", async () => {
      const request = {
        language: "typescript",
        filePath: "test.ts",
        cursor: { line: 0, character: 10 },
        prefix: "const hello",
        suffix: ";"
      };

      await service.complete(request);

      expect(mockAdapter.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 800,
          temperature: 0.1
        })
      );
    });

    it("normalizes long multiline suggestions before returning them", async () => {
      mockAdapter.complete = vi.fn().mockResolvedValue({
        suggestion: "helloWorld\nconsole.log('extra');",
        stopReason: "length",
        model: "test-model"
      });

      const result = await service.complete({
        language: "typescript",
        filePath: "test.ts",
        cursor: { line: 0, character: 11 },
        prefix: "const hello",
        suffix: ";"
      });

      expect(result.suggestion).toBe("World");
    });
  });

  describe("normalizeInlineSuggestion", () => {
    it("keeps only the first line and removes duplicated prefix tail", () => {
      expect(normalizeInlineSuggestion("const hello", "helloWorld\nnext line")).toBe("World");
    });

    it("removes thinking tokens from suggestion", () => {
      expect(normalizeInlineSuggestion("const value = ", "<think>")).toBe("");
      expect(normalizeInlineSuggestion("const value = ", "<think>result")).toBe("result");
    });

    it("extracts completion from JSON-only response", () => {
      expect(
        normalizeInlineSuggestion("const value = ", '{"completion":"result"}')
      ).toBe("result");
    });

    it("rejects prose responses", () => {
      expect(
        normalizeInlineSuggestion(
          "const value = ",
          "The user wants me to return the next short inline continuation at the cursor."
        )
      ).toBe("");
    });

    it("trims long suggestions to inline-friendly length", () => {
      const suggestion = "a".repeat(200);
      expect(normalizeInlineSuggestion("const value = ", suggestion)).toHaveLength(120);
    });
  });

  describe("telemetry", () => {
    it("records telemetry for completion", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const telemetryWithLogging = new TelemetryService({ enabled: true });
      const serviceWithTelemetry = new CompletionService({
        adapter: mockAdapter,
        cache,
        telemetry: telemetryWithLogging,
        modelName: "test-model"
      });

      serviceWithTelemetry.complete({
        language: "typescript",
        filePath: "test.ts",
        cursor: { line: 0, character: 10 },
        prefix: "const hello",
        suffix: ";"
      });

      consoleSpy.mockRestore();
    });
  });
});
