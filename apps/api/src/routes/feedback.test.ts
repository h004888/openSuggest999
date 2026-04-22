import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerFeedbackRoute } from "./feedback";

describe("registerFeedbackRoute", () => {
  let mockApp: any;
  let mockTelemetry: any;

  beforeEach(() => {
    mockTelemetry = {
      recordFeedback: vi.fn()
    };
    mockApp = {
      post: vi.fn()
    };
  });

  it("registers POST /v1/completions/feedback route", async () => {
    await registerFeedbackRoute(mockApp, { telemetry: mockTelemetry });

    expect(mockApp.post).toHaveBeenCalledTimes(1);
    expect(mockApp.post).toHaveBeenCalledWith(
      "/v1/completions/feedback",
      expect.any(Function)
    );
  });

  it("records feedback when data is valid", async () => {
    await registerFeedbackRoute(mockApp, { telemetry: mockTelemetry });

    const routeHandler = mockApp.post.mock.calls[0][1];
    const mockRequest = {
      body: {
        requestId: "req-123",
        language: "typescript",
        filePath: "src/test.ts",
        accepted: true,
        suggestionLength: 42
      }
    };
    const mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    await routeHandler(mockRequest, mockReply);

    expect(mockTelemetry.recordFeedback).toHaveBeenCalledWith({
      requestId: "req-123",
      language: "typescript",
      filePath: "src/test.ts",
      accepted: true,
      suggestionLength: 42
    });
    expect(mockReply.send).toHaveBeenCalledWith({ ok: true });
  });

  it("returns 400 when feedback data is invalid", async () => {
    await registerFeedbackRoute(mockApp, { telemetry: mockTelemetry });

    const routeHandler = mockApp.post.mock.calls[0][1];
    const mockRequest = {
      body: {
        requestId: 123, // should be string
        language: "typescript",
        filePath: "src/test.ts",
        accepted: "yes", // should be boolean
        suggestionLength: "42" // should be number
      }
    };
    const mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    await routeHandler(mockRequest, mockReply);

    expect(mockTelemetry.recordFeedback).not.toHaveBeenCalled();
    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid feedback data"
      }
    });
  });

  it("returns 400 when requestId is missing", async () => {
    await registerFeedbackRoute(mockApp, { telemetry: mockTelemetry });

    const routeHandler = mockApp.post.mock.calls[0][1];
    const mockRequest = {
      body: {
        language: "typescript",
        filePath: "src/test.ts",
        accepted: true,
        suggestionLength: 42
      }
    };
    const mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    await routeHandler(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(400);
  });

  it("returns 400 when accepted field is missing", async () => {
    await registerFeedbackRoute(mockApp, { telemetry: mockTelemetry });

    const routeHandler = mockApp.post.mock.calls[0][1];
    const mockRequest = {
      body: {
        requestId: "req-123",
        language: "typescript",
        filePath: "src/test.ts",
        suggestionLength: 42
      }
    };
    const mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    await routeHandler(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(400);
  });

  it("records feedback when accepted is false", async () => {
    await registerFeedbackRoute(mockApp, { telemetry: mockTelemetry });

    const routeHandler = mockApp.post.mock.calls[0][1];
    const mockRequest = {
      body: {
        requestId: "req-456",
        language: "javascript",
        filePath: "index.js",
        accepted: false,
        suggestionLength: 10
      }
    };
    const mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    await routeHandler(mockRequest, mockReply);

    expect(mockTelemetry.recordFeedback).toHaveBeenCalledWith({
      requestId: "req-456",
      language: "javascript",
      filePath: "index.js",
      accepted: false,
      suggestionLength: 10
    });
  });
});
