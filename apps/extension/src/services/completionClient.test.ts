import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompletionClient } from "./completionClient";
import type { OpenSuggestSettings } from "../config/settings";

describe("CompletionClient", () => {
  let settings: OpenSuggestSettings;
  let client: CompletionClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    settings = {
      apiBaseUrl: "http://localhost:3030",
      apiKey: "test-key",
      requestTimeoutMs: 1000,
      debounceMs: 500
    };
    client = new CompletionClient(settings);
  });

  describe("fetchInlineCompletion", () => {
    it("returns completion when API returns a valid response", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue({
          suggestion: "()",
          model: "MiniMax-M2.7",
          latencyMs: 50,
          cached: false
        })
      });
      globalThis.fetch = fetchSpy as typeof fetch;

      const request = {
        filePath: "src/main.ts",
        language: "typescript",
        cursor: { line: 0, character: 11 },
        prefix: "const hello",
        suffix: "",
        editor: "vscode",
        requestId: "req-1"
      };

      const result = await client.fetchInlineCompletion(request);

      expect(result).toEqual({
        suggestion: "()",
        model: "MiniMax-M2.7",
        latencyMs: 50,
        cached: false
      });
      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:3030/v1/completions/inline",
        expect.objectContaining({
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": "test-key"
          },
          body: JSON.stringify(request)
        })
      );
    });

    it("returns null when API call succeeds but response is invalid", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue({
          model: "MiniMax-M2.7"
        })
      }) as typeof fetch;

      const result = await client.fetchInlineCompletion({
        filePath: "src/main.ts",
        language: "typescript",
        cursor: { line: 0, character: 11 },
        prefix: "const hello",
        suffix: ""
      });

      expect(result).toBeNull();
    });

    it("returns null when API returns non-2xx", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: vi.fn().mockResolvedValue("error")
      }) as typeof fetch;

      const result = await client.fetchInlineCompletion({
        filePath: "src/main.ts",
        language: "typescript",
        cursor: { line: 0, character: 11 },
        prefix: "const hello",
        suffix: ""
      });

      expect(result).toBeNull();
    });

    it("returns null when API call throws", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as typeof fetch;

      const result = await client.fetchInlineCompletion({
        filePath: "src/main.ts",
        language: "typescript",
        cursor: { line: 0, character: 11 },
        prefix: "const hello",
        suffix: ""
      });

      expect(result).toBeNull();
    });

    it("returns null when cancelled before fetch", async () => {
      const result = await client.fetchInlineCompletion(
        {
          filePath: "src/main.ts",
          language: "typescript",
          cursor: { line: 0, character: 11 },
          prefix: "const hello",
          suffix: ""
        },
        { isCancellationRequested: true }
      );

      expect(result).toBeNull();
    });

    it("aborts previous in-flight request for the same file", async () => {
      let firstSignal: AbortSignal | undefined;
      let releaseFirst: (() => void) | undefined;

      globalThis.fetch = vi.fn((_, init) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (!firstSignal) {
          firstSignal = signal;
          return new Promise((resolve) => {
            releaseFirst = () => resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: vi.fn().mockResolvedValue({
                suggestion: "first",
                model: "MiniMax-M2.7",
                latencyMs: 50,
                cached: false
              })
            });
          });
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: vi.fn().mockResolvedValue({
            suggestion: "second",
            model: "MiniMax-M2.7",
            latencyMs: 25,
            cached: false
          })
        });
      }) as typeof fetch;

      const firstPromise = client.fetchInlineCompletion({
        filePath: "src/main.ts",
        language: "typescript",
        cursor: { line: 0, character: 11 },
        prefix: "const hello",
        suffix: "",
        requestId: "first"
      });

      const secondResult = await client.fetchInlineCompletion({
        filePath: "src/main.ts",
        language: "typescript",
        cursor: { line: 0, character: 12 },
        prefix: "const hello!",
        suffix: "",
        requestId: "second"
      });

      expect(firstSignal?.aborted).toBe(true);
      expect(secondResult?.suggestion).toBe("second");
      releaseFirst?.();
      await firstPromise;
    });

    it("handles abort error gracefully", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")) as typeof fetch;

      const result = await client.fetchInlineCompletion({
        filePath: "src/main.ts",
        language: "typescript",
        cursor: { line: 0, character: 11 },
        prefix: "const hello",
        suffix: ""
      });

      expect(result).toBeNull();
    });
  });

  describe("updateSettings", () => {
    it("updates client configuration", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const newSettings: OpenSuggestSettings = {
        apiBaseUrl: "http://localhost:4040",
        apiKey: "new-key",
        requestTimeoutMs: 2000,
        debounceMs: 300
      };

      client.updateSettings(newSettings);

      expect(client.settings.apiBaseUrl).toBe("http://localhost:4040");
      expect(client.settings.apiKey).toBe("new-key");
      expect(client.settings.debounceMs).toBe(300);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Settings updated"));
    });
  });
});
