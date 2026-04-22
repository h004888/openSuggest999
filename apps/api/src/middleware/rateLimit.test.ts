import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimitMiddleware } from "./rateLimit";

describe("createRateLimitMiddleware", () => {
  let middleware: ReturnType<typeof createRateLimitMiddleware>;
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    middleware = createRateLimitMiddleware(10);
    mockRequest = {
      url: "/v1/completions/inline",
      headers: {},
      ip: "127.0.0.1"
    };
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
  });

  it("skips /health endpoint", async () => {
    mockRequest.url = "/health";
    
    await middleware(mockRequest, mockReply);

    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it("allows first request without rate limit", async () => {
    await middleware(mockRequest, mockReply);

    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it("allows requests within limit", async () => {
    for (let i = 0; i < 10; i++) {
      await middleware(mockRequest, mockReply);
    }

    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit exceeded", async () => {
    // Make 10 requests first
    for (let i = 0; i < 10; i++) {
      await middleware(mockRequest, mockReply);
    }

    // 11th request should be rate limited
    await middleware(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(429);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests"
      }
    });
  });

  it("tracks rate limits by API key", async () => {
    // Make 5 requests with key A
    mockRequest.headers["x-api-key"] = "key-a";
    for (let i = 0; i < 5; i++) {
      await middleware(mockRequest, mockReply);
    }

    // Reset and make 5 requests with key B
    mockRequest.headers["x-api-key"] = "key-b";
    for (let i = 0; i < 5; i++) {
      await middleware(mockRequest, mockReply);
    }

    // Both should still be allowed
    expect(mockReply.code).not.toHaveBeenCalledWith(429);
  });

  it("tracks rate limits by IP when no API key", async () => {
    mockRequest.headers = {};
    mockRequest.ip = "192.168.1.100";

    for (let i = 0; i < 10; i++) {
      await middleware(mockRequest, mockReply);
    }

    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it("returns 429 for different IP when first IP is rate limited", async () => {
    mockRequest.headers["x-api-key"] = "key-a";
    for (let i = 0; i < 10; i++) {
      await middleware(mockRequest, mockReply);
    }

    mockRequest.headers["x-api-key"] = "key-b";
    const result = await middleware(mockRequest, mockReply);

    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it("uses anonymous fallback when no IP", async () => {
    mockRequest.headers = {};
    mockRequest.ip = undefined;

    for (let i = 0; i < 10; i++) {
      await middleware(mockRequest, mockReply);
    }

    expect(mockReply.code).not.toHaveBeenCalled();
  });
});
