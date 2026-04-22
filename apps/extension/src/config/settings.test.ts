import { describe, expect, it } from "vitest";
import { __setConfig } from "vscode";
import { getSettings } from "./settings";

describe("getSettings", () => {
  it("loads values from vscode configuration", () => {
    __setConfig({
      "openSuggest.apiBaseUrl": "http://localhost:3333",
      "openSuggest.apiKey": "abc",
      "openSuggest.requestTimeoutMs": 2222,
      "openSuggest.debounceMs": 333
    });

    const settings = getSettings();

    expect(settings).toEqual({
      apiBaseUrl: "http://localhost:3333",
      apiKey: "abc",
      requestTimeoutMs: 2222,
      debounceMs: 333
    });
  });

  it("uses inline-friendly defaults when unset", () => {
    __setConfig({});

    const settings = getSettings();

    expect(settings.requestTimeoutMs).toBe(5000);
    expect(settings.debounceMs).toBe(500);
  });
});
