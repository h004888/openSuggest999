import { describe, it, expect, vi } from "vitest";
import { createApp } from "./app";
import { registerErrorHandler } from "./middleware/errorHandler.js";

describe("createApp", () => {
  it("creates app with error handler registered", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234"
    };

    const { app, env } = createApp();
    
    expect(app).toBeDefined();
    expect(env).toBeDefined();
    expect(env.port).toBe(3030);
    
    process.env = originalEnv;
  });

  it("creates app with default port when not specified", () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      OPEN_SUGGEST_OPENAI_API_KEY: "test-key-123456789012345678901234"
    };

    const { env } = createApp();
    
    expect(env.port).toBe(3030);
    
    process.env = originalEnv;
  });
});
