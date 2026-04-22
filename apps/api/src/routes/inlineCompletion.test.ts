import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerInlineCompletionRoute } from "./inlineCompletion";
import type { CompletionService } from "../services/completionService.js";
import type { TelemetryService } from "../services/telemetryService.js";

describe("registerInlineCompletionRoute", () => {
  let mockApp: any;
  let mockCompletionService: CompletionService;
  let mockTelemetry: TelemetryService;

  beforeEach(() => {
    mockCompletionService = {
      complete: vi.fn()
    } as any;
    mockTelemetry = {
      recordCompletion: vi.fn()
    } as any;
    mockApp = {
      post: vi.fn()
    };
  });

  it("registers POST /v1/completions/inline route", async () => {
    await registerInlineCompletionRoute(mockApp, {
      completionService: mockCompletionService,
      telemetry: mockTelemetry
    });

    expect(mockApp.post).toHaveBeenCalledTimes(1);
    expect(mockApp.post).toHaveBeenCalledWith(
      "/v1/completions/inline",
      expect.any(Function)
    );
  });

  it("returns 400 when request body is invalid", async () => {
    mockCompletionService.complete = vi.fn();

    await registerInlineCompletionRoute(mockApp, {
      completionService: mockCompletionService,
      telemetry: mockTelemetry
    });

    const routeHandler = mockApp.post.mock.calls[0][1];
    const mockRequest = {
      body: {
        filePath: "test.ts",
        // missing required fields
        prefix: "const test",
        suffix: ";"
      }
    };
    const mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    await routeHandler(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockCompletionService.complete).not.toHaveBeenCalled();
  });

  it("returns completion when request is valid", async () => {
    const mockCompletion = {
      suggestion: "test completion result",
      model: "test-model",
      latencyMs: 100,
      cached: false
    };
    mockCompletionService.complete = vi.fn().mockResolvedValue(mockCompletion);

    await registerInlineCompletionRoute(mockApp, {
      completionService: mockCompletionService,
      telemetry: mockTelemetry
    });

    const routeHandler = mockApp.post.mock.calls[0][1];
    const mockRequest = {
      body: {
        language: "typescript",
        filePath: "test.ts",
        cursor: { line: 0, character: 10 },
        prefix: "const test",
        suffix: ";"
      }
    };
    const mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    await routeHandler(mockRequest, mockReply);

    expect(mockCompletionService.complete).toHaveBeenCalled();
    expect(mockReply.send).toHaveBeenCalledWith(mockCompletion);
  });
});
