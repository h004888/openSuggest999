import * as vscode from "vscode";

export type OpenSuggestSettings = {
  apiBaseUrl: string;
  apiKey?: string;
  requestTimeoutMs: number;
  debounceMs: number;
};

export function getSettings(): OpenSuggestSettings {
  const config = vscode.workspace.getConfiguration("openSuggest");

  return {
    apiBaseUrl: config.get<string>("apiBaseUrl", "http://localhost:3030"),
    apiKey: config.get<string>("apiKey") || undefined,
    requestTimeoutMs: config.get<number>("requestTimeoutMs", 5000),
    debounceMs: config.get<number>("debounceMs", 500)
  };
}
