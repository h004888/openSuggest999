import { describe, it, expect } from "vitest";
import { getEnv } from "./env";

describe("getEnv", () => {
  it("loads environment from process.env", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_PORT: "4040",
      OPEN_SUGGEST_OPENAI_BASE_URL: "https://api.test.com/v1",
      OPEN_SUGGEST_OPENAI_MODEL: "test-model"
    };

    const env = getEnv();
    
    expect(env.openaiApiKey).toBe("test-key-123456789012345678901234");
    expect(env.port).toBe(4040);
    expect(env.openaiBaseUrl).toBe("https://api.test.com/v1");
    expect(env.model).toBe("test-model");
    
    process.env = originalEnv;
  });

  it("uses default values when env vars not set", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234"
    };
    delete process.env.OPEN_SUGGEST_PORT;
    delete process.env.OPEN_SUGGEST_OPENAI_BASE_URL;
    delete process.env.OPEN_SUGGEST_OPENAI_MODEL;
    delete process.env.OPEN_SUGGEST_FALLBACK_MODEL;

    const env = getEnv();
    
    expect(env.port).toBe(3030);
    expect(env.openaiBaseUrl).toBe("https://api.openai.com/v1");
    expect(env.model).toBe("gpt-4.1-mini");
    expect(env.fallbackModel).toBeUndefined();
    
    process.env = originalEnv;
  });

  it("parses numeric values correctly", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_PORT: "8080",
      OPEN_SUGGEST_TIMEOUT_MS: "5000",
      OPEN_SUGGEST_CACHE_TTL_MS: "60000",
      OPEN_SUGGEST_RATE_LIMIT_PER_MIN: "100"
    };

    const env = getEnv();
    
    expect(env.port).toBe(8080);
    expect(env.timeoutMs).toBe(5000);
    expect(env.cacheTtlMs).toBe(60000);
    expect(env.rateLimitPerMin).toBe(100);
    
    process.env = originalEnv;
  });

  it("uses fallback when numeric value is invalid", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_PORT: "invalid",
      OPEN_SUGGEST_TIMEOUT_MS: "not-a-number"
    };

    const env = getEnv();
    
    expect(env.port).toBe(3030);
    expect(env.timeoutMs).toBe(1500);
    
    process.env = originalEnv;
  });

  it("normalizes MiniMax model names", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_OPENAI_BASE_URL: "https://api.minimax.io/v1",
      OPEN_SUGGEST_OPENAI_MODEL: "minimax-m2.7"
    };

    const env = getEnv();
    
    expect(env.model).toBe("MiniMax-M2.7");
    
    process.env = originalEnv;
  });

  it("normalizes fallback model for MiniMax", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_OPENAI_BASE_URL: "https://api.minimax.io/v1",
      OPEN_SUGGEST_OPENAI_MODEL: "minimax-m2.5",
      OPEN_SUGGEST_FALLBACK_MODEL: "minimax-m2.7"
    };

    const env = getEnv();
    
    expect(env.model).toBe("MiniMax-M2.5");
    expect(env.fallbackModel).toBe("MiniMax-M2.7");
    
    process.env = originalEnv;
  });

  it("parses JSON headers", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_OPENAI_HEADERS_JSON: '{"Authorization":"Bearer token123"}'
    };

    const env = getEnv();
    
    expect(env.openaiExtraHeaders).toEqual({
      Authorization: "Bearer token123"
    });
    
    process.env = originalEnv;
  });

  it("ignores invalid JSON headers", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_OPENAI_HEADERS_JSON: "not-valid-json"
    };

    const env = getEnv();
    
    expect(env.openaiExtraHeaders).toBeUndefined();
    
    process.env = originalEnv;
  });

  it("parses JSON extra body", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_OPENAI_EXTRA_BODY_JSON: '{"extra_param":"value"}'
    };

    const env = getEnv();
    
    expect(env.openaiExtraBody).toEqual({ extra_param: "value" });
    
    process.env = originalEnv;
  });

  it("keeps custom model names for non-MiniMax URLs", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_OPENAI_BASE_URL: "https://api.openai.com/v1",
      OPEN_SUGGEST_OPENAI_MODEL: "custom-model-v3"
    };

    const env = getEnv();
    
    expect(env.model).toBe("custom-model-v3");
    
    process.env = originalEnv;
  });

  it("handles appApiKey when set", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234",
      OPEN_SUGGEST_API_KEY: "my-app-key"
    };

    const env = getEnv();
    
    expect(env.appApiKey).toBe("my-app-key");
    
    process.env = originalEnv;
  });

  it("throws when API key is missing", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv
    };
    delete process.env.OPEN_SUGGEST_OPENAI_API_KEY;

    expect(() => getEnv()).toThrow("Missing OPEN_SUGGEST_OPENAI_API_KEY");
    
    process.env = originalEnv;
  });
});
