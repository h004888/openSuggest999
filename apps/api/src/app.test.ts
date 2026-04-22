import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const ORIGINAL_ENV = { ...process.env };

describe("createApp", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("health route works without api key header", async () => {
    process.env.OPEN_SUGGEST_OPENAI_API_KEY = "dummy";
    process.env.OPEN_SUGGEST_API_KEY = "local-key";

    const { app } = createApp();
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    await app.close();
  });

  it("inline route requires x-api-key when configured", async () => {
    process.env.OPEN_SUGGEST_OPENAI_API_KEY = "dummy";
    process.env.OPEN_SUGGEST_API_KEY = "local-key";

    const { app } = createApp();
    const response = await app.inject({
      method: "POST",
      url: "/v1/completions/inline",
      payload: {
        language: "typescript",
        filePath: "src/main.ts",
        cursor: { line: 1, character: 1 },
        prefix: "const a =",
        suffix: "",
        requestId: "req-1"
      }
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
