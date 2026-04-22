import type { OpenSuggestSettings } from "../config/settings";
import { logger } from "../logging";
import {
  isInlineCompletionResponse,
  type InlineCompletionRequest,
  type InlineCompletionResponse
} from "../types/completion";

export class CompletionClient {
  private readonly inFlightRequests = new Map<string, AbortController>();

  constructor(public settings: OpenSuggestSettings) {}

  updateSettings(newSettings: OpenSuggestSettings): void {
    this.settings = newSettings;
    logger.info("Settings updated", {
      apiBaseUrl: newSettings.apiBaseUrl,
      hasApiKey: !!newSettings.apiKey,
      requestTimeoutMs: newSettings.requestTimeoutMs
    });
  }

  async fetchInlineCompletion(
    request: InlineCompletionRequest,
    token?: { isCancellationRequested: boolean }
  ): Promise<InlineCompletionResponse | null> {
    const requestId = request.requestId ?? crypto.randomUUID();

    logger.debug(`[${requestId}] Starting completion request`);
    logger.debug(`[${requestId}] Request details:`, {
      filePath: request.filePath,
      language: request.language,
      prefixLength: request.prefix.length,
      suffixLength: request.suffix.length,
      apiBaseUrl: this.settings.apiBaseUrl,
      hasApiKey: !!this.settings.apiKey,
      timeout: this.settings.requestTimeoutMs
    });

    if (token?.isCancellationRequested) {
      logger.debug(`[${requestId}] Cancelled before fetch`);
      return null;
    }

    const inFlightKey = `${request.filePath}:${request.language}`;
    const previousController = this.inFlightRequests.get(inFlightKey);
    if (previousController) {
      previousController.abort();
      logger.debug(`[${requestId}] Aborted previous in-flight request`, { inFlightKey });
    }

    const controller = new AbortController();
    this.inFlightRequests.set(inFlightKey, controller);

    const timer = setTimeout(() => {
      controller.abort();
      logger.warn(`[${requestId}] Request timed out after ${this.settings.requestTimeoutMs}ms`);
    }, this.settings.requestTimeoutMs);

    try {
      const url = `${this.settings.apiBaseUrl}/v1/completions/inline`;
      logger.debug(`[${requestId}] Fetching: POST ${url}`);

      const response = await fetch(
        url,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "content-type": "application/json",
            ...(this.settings.apiKey
              ? { "x-api-key": this.settings.apiKey }
              : {})
          },
          body: JSON.stringify(request)
        }
      );

      logger.debug(`[${requestId}] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        logger.error(`[${requestId}] API Error: ${response.status} ${response.statusText}`, { body: errorText });
        return null;
      }

      const json = await response.json();

      if (!isInlineCompletionResponse(json)) {
        logger.error(`[${requestId}] Invalid response format:`, json);
        return null;
      }

      logger.info(`[${requestId}] Completion received`, {
        suggestionLength: json.suggestion.length,
        model: json.model,
        latencyMs: json.latencyMs,
        cached: json.cached
      });

      return json;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.warn(`[${requestId}] Request aborted/timeout`);
      } else {
        logger.error(`[${requestId}] Fetch failed:`, error);
      }
      return null;
    } finally {
      clearTimeout(timer);
      if (this.inFlightRequests.get(inFlightKey) === controller) {
        this.inFlightRequests.delete(inFlightKey);
      }
    }
  }
}