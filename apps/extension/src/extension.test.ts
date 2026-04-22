import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { activate, deactivate } from "./extension";

describe("extension", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (vscode as typeof vscode & { __reset: () => void; __setConfig: (config: Record<string, unknown>) => void }).__reset();
    (vscode as typeof vscode & { __setConfig: (config: Record<string, unknown>) => void }).__setConfig({
      "openSuggest.apiBaseUrl": "http://localhost:3030",
      "openSuggest.apiKey": "local-dev-key",
      "openSuggest.requestTimeoutMs": 10000,
      "openSuggest.debounceMs": 200
    });
  });

  it("registers provider, output channel and config listener on activate", () => {
    const context = { subscriptions: [] as Array<{ dispose: () => void }> } as any;

    activate(context);

    const providerRegistration = (vscode as typeof vscode & {
      __getRegisteredInlineCompletionProvider: () => { selector: unknown } | undefined;
      __getOutputChannels: () => Array<{ name: string }>;
    }).__getRegisteredInlineCompletionProvider();

    expect(providerRegistration).toBeDefined();
    expect(providerRegistration?.selector).toEqual({ pattern: "**" });
    expect(context.subscriptions).toHaveLength(3);
    expect((vscode as typeof vscode & { __getOutputChannels: () => Array<{ name: string }> }).__getOutputChannels()).toHaveLength(1);
    expect((vscode as typeof vscode & { __getOutputChannels: () => Array<{ name: string }> }).__getOutputChannels()[0]?.name).toBe("OpenSuggest");
  });

  it("reacts to openSuggest config changes", () => {
    const context = { subscriptions: [] as Array<{ dispose: () => void }> } as any;
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    activate(context);
    (vscode as typeof vscode & { __setConfig: (config: Record<string, unknown>) => void }).__setConfig({
      "openSuggest.apiBaseUrl": "http://localhost:4040",
      "openSuggest.apiKey": "new-key",
      "openSuggest.requestTimeoutMs": 15000,
      "openSuggest.debounceMs": 350
    });

    (vscode as typeof vscode & { __fireConfigurationChange: (section: string) => void }).__fireConfigurationChange("openSuggest");

    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Settings changed, updating"));
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Settings updated"));
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Updated settings"));
    expect(logSpy.mock.calls.some(([message]) => String(message).includes("Debounce updated: 350ms"))).toBe(true);
  });

  describe("deactivate", () => {
    it("logs deactivation message", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      deactivate();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Extension deactivated"));
    });
  });
});
