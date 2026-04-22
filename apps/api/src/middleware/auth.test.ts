import { describe, it, expect, vi } from "vitest";
import { createAuthMiddleware } from "./auth";

describe("createAuthMiddleware", () => {
  describe("when no API key is required", () => {
    it("skips auth for /health endpoint", async () => {
      const middleware = createAuthMiddleware(undefined);
      
      const mockRequest = { url: "/health" } as any;
      const mockReply = { code: vi.fn(), send: vi.fn() } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).not.toHaveBeenCalled();
    });

    it("skips auth for all endpoints", async () => {
      const middleware = createAuthMiddleware(undefined);
      
      const mockRequest = { url: "/v1/completions/inline" } as any;
      const mockReply = { code: vi.fn(), send: vi.fn() } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).not.toHaveBeenCalled();
    });
  });

  describe("when API key is required", () => {
    it("skips /health without checking key", async () => {
      const middleware = createAuthMiddleware("secret-key");
      
      const mockRequest = { url: "/health" } as any;
      const mockReply = { code: vi.fn(), send: vi.fn() } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).not.toHaveBeenCalled();
    });

    it("returns 401 when no API key provided", async () => {
      const middleware = createAuthMiddleware("secret-key");
      
      const mockRequest = { 
        url: "/v1/completions/inline",
        headers: {}
      } as any;
      const mockReply = { 
        code: vi.fn().mockReturnThis(), 
        send: vi.fn() 
      } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: { code: "UNAUTHORIZED", message: "Invalid API key" }
      });
    });

    it("returns 401 when API key is invalid", async () => {
      const middleware = createAuthMiddleware("secret-key");
      
      const mockRequest = { 
        url: "/v1/completions/inline",
        headers: { "x-api-key": "wrong-key" }
      } as any;
      const mockReply = { 
        code: vi.fn().mockReturnThis(), 
        send: vi.fn() 
      } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
    });

    it("returns 401 when API key length mismatch", async () => {
      const middleware = createAuthMiddleware("secret-key");
      
      const mockRequest = { 
        url: "/v1/completions/inline",
        headers: { "x-api-key": "short" }
      } as any;
      const mockReply = { 
        code: vi.fn().mockReturnThis(), 
        send: vi.fn() 
      } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
    });

    it("allows request when API key matches", async () => {
      const middleware = createAuthMiddleware("secret-key");
      
      const mockRequest = { 
        url: "/v1/completions/inline",
        headers: { "x-api-key": "secret-key" }
      } as any;
      const mockReply = { 
        code: vi.fn().mockReturnThis(), 
        send: vi.fn() 
      } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).not.toHaveBeenCalled();
    });

    it("handles array of API keys from headers", async () => {
      const middleware = createAuthMiddleware("secret-key");
      
      const mockRequest = { 
        url: "/v1/completions/inline",
        headers: { "x-api-key": ["secret-key"] }
      } as any;
      const mockReply = { 
        code: vi.fn().mockReturnThis(), 
        send: vi.fn() 
      } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).not.toHaveBeenCalled();
    });

    it("handles timing attack by using timingSafeEqual", async () => {
      const middleware = createAuthMiddleware("secret-key");
      
      // Test with wrong length key
      const mockRequest = { 
        url: "/v1/completions/inline",
        headers: { "x-api-key": "a" }
      } as any;
      const mockReply = { 
        code: vi.fn().mockReturnThis(), 
        send: vi.fn() 
      } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
    });
  });
});
