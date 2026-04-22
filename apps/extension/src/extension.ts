import * as vscode from "vscode";
import { getSettings } from "./config/settings";
import { logger, setOutputChannel } from "./logging";
import { OpenSuggestInlineCompletionProvider } from "./providers/inlineCompletionProvider";
import { CompletionClient } from "./services/completionClient";
import { DebounceGate } from "./services/debounce";

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel("OpenSuggest");
  context.subscriptions.push(outputChannel);
  setOutputChannel(outputChannel);

  const settings = getSettings();
  const client = new CompletionClient(settings);
  const debounceGate = new DebounceGate(settings.debounceMs);

  // Create provider with initial instances
  const completionProvider = new OpenSuggestInlineCompletionProvider(
    client,
    debounceGate
  );

  // Register the completion provider
  const registration = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: "**" },
    completionProvider
  );

  context.subscriptions.push(registration);

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("openSuggest")) {
        logger.info("Settings changed, updating");

        const newSettings = getSettings();
        client.updateSettings(newSettings);
        debounceGate.updateDebounceMs(newSettings.debounceMs);

        logger.info("Updated settings", {
          apiBaseUrl: newSettings.apiBaseUrl,
          hasApiKey: !!newSettings.apiKey,
          requestTimeoutMs: newSettings.requestTimeoutMs,
          debounceMs: newSettings.debounceMs
        });
      }
    })
  );

  logger.info("Extension activated with settings", {
    apiBaseUrl: settings.apiBaseUrl,
    hasApiKey: !!settings.apiKey,
    requestTimeoutMs: settings.requestTimeoutMs,
    debounceMs: settings.debounceMs
  });
}

export function deactivate(): void {
  logger.info("Extension deactivated");
  setOutputChannel(undefined);
}