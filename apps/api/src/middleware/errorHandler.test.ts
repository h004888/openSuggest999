import { describe, it, expect, vi } from "vitest";
import { registerErrorHandler } from "./errorHandler";

describe("registerErrorHandler", () => {
  it("registers error handler that returns 500 with INTERNAL_ERROR", async () => {
    const mockApp = {
      setErrorHandler: vi.fn(),
      log: { error: vi.fn() }
    } as any;

    registerErrorHandler(mockApp);

    expect(mockApp.setErrorHandler).toHaveBeenCalledTimes(1);

    const errorHandler = mockApp.setErrorHandler.mock.calls[0][0];
    const mockRequest = {};
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    const testError = new Error("Test error");
    errorHandler(testError, mockRequest, mockReply);

    expect(mockApp.log.error).toHaveBeenCalledWith(testError);
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error"
      }
    });
  });

  it("handles non-Error objects", async () => {
    const mockApp = {
      setErrorHandler: vi.fn(),
      log: { error: vi.fn() }
    } as any;

    registerErrorHandler(mockApp);

    const errorHandler = mockApp.setErrorHandler.mock.calls[0][0];
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    errorHandler("string error", {}, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error"
      }
    });
  });
});
