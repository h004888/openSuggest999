import { describe, it, expect, vi, beforeEach } from "vitest";
import { TelemetryService } from "./telemetryService";

describe("TelemetryService", () => {
  describe("constructor", () => {
    it("generates anonymous ID when not provided", () => {
      const service = new TelemetryService();
      expect(service).toBeDefined();
    });

    it("uses provided anonymous ID", () => {
      const service = new TelemetryService({
        enabled: true,
        anonymousId: "custom-id-123"
      });
      expect(service).toBeDefined();
    });

    it("can be disabled", () => {
      const service = new TelemetryService({ enabled: false });
      expect(service).toBeDefined();
    });
  });

  describe("recordCompletion", () => {
    it("logs completion event to console", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ enabled: true });

      service.recordCompletion({
        language: "typescript",
        filePath: "test.ts",
        latencyMs: 100,
        model: "gpt-4",
        cached: false,
        suggestionLength: 50,
        suggestionPreview: "return value;"
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleSpy.mock.calls[0][0];
      expect(typeof logCall).toBe("string");
      const logOutput = JSON.parse(logCall);
      expect(logOutput.type).toBe("completion");
      expect(logOutput.language).toBe("typescript");
      expect(logOutput.suggestionLength).toBe(50);
      expect(logOutput.suggestionPreview).toBe("return value;");

      consoleSpy.mockRestore();
    });

    it("does not log when disabled", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ enabled: false });

      service.recordCompletion({
        language: "typescript",
        filePath: "test.ts",
        latencyMs: 100,
        model: "gpt-4",
        cached: false,
        suggestionLength: 50,
        suggestionPreview: "return value;"
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("includes optional requestId", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ enabled: true });

      service.recordCompletion({
        requestId: "req-123",
        language: "typescript",
        filePath: "test.ts",
        latencyMs: 100,
        model: "gpt-4",
        cached: false,
        suggestionLength: 50
      });

      const logCall = consoleSpy.mock.calls[0][0];
      const logOutput = JSON.parse(logCall);
      expect(logOutput.requestId).toBe("req-123");

      consoleSpy.mockRestore();
    });
  });

  describe("recordFeedback", () => {
    it("logs feedback event to console", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ enabled: true });

      service.recordFeedback({
        requestId: "req-123",
        language: "typescript",
        filePath: "test.ts",
        accepted: true,
        suggestionLength: 50
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleSpy.mock.calls[0][0];
      const logOutput = JSON.parse(logCall);
      expect(logOutput.type).toBe("feedback");
      expect(logOutput.accepted).toBe(true);

      consoleSpy.mockRestore();
    });

    it("logs when accepted is false", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ enabled: true });

      service.recordFeedback({
        requestId: "req-456",
        language: "javascript",
        filePath: "index.js",
        accepted: false,
        suggestionLength: 25
      });

      const logCall = consoleSpy.mock.calls[0][0];
      const logOutput = JSON.parse(logCall);
      expect(logOutput.accepted).toBe(false);
      expect(logOutput.suggestionLength).toBe(25);

      consoleSpy.mockRestore();
    });

    it("does not log when disabled", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ enabled: false });

      service.recordFeedback({
        requestId: "req-123",
        language: "typescript",
        filePath: "test.ts",
        accepted: true,
        suggestionLength: 50
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("includes timestamp", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ enabled: true });

      service.recordFeedback({
        requestId: "req-123",
        language: "typescript",
        filePath: "test.ts",
        accepted: true,
        suggestionLength: 50
      });

      const logCall = consoleSpy.mock.calls[0][0];
      const logOutput = JSON.parse(logCall);
      expect(logOutput.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("includes anonymousId", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ 
        enabled: true,
        anonymousId: "anon-999"
      });

      service.recordFeedback({
        requestId: "req-123",
        language: "typescript",
        filePath: "test.ts",
        accepted: true,
        suggestionLength: 50
      });

      const logCall = consoleSpy.mock.calls[0][0];
      const logOutput = JSON.parse(logCall);
      expect(logOutput.anonymousId).toBe("anon-999");

      consoleSpy.mockRestore();
    });
  });

  describe("sendToRemote", () => {
    it("sends telemetry to remote endpoint when configured", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true
      });

      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ 
        enabled: true,
        endpoint: "https://telemetry.example.com/collect"
      });

      service.recordCompletion({
        language: "typescript",
        filePath: "test.ts",
        latencyMs: 100,
        model: "gpt-4",
        cached: false,
        suggestionLength: 50,
        suggestionPreview: "return value;"
      });

      // Wait for async sendToRemote
      await new Promise(resolve => setTimeout(resolve, 50));

      consoleSpy.mockRestore();
    });

    it("handles remote endpoint errors gracefully", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const service = new TelemetryService({ 
        enabled: true,
        endpoint: "https://telemetry.example.com/collect"
      });

      service.recordCompletion({
        language: "typescript",
        filePath: "test.ts",
        latencyMs: 100,
        model: "gpt-4",
        cached: false,
        suggestionLength: 50,
        suggestionPreview: "return value;"
      });

      // Should not throw, just log locally
      await new Promise(resolve => setTimeout(resolve, 50));

      consoleSpy.mockRestore();
    });
  });
});
