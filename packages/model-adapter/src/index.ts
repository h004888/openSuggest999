import type {
  CompletionModelAdapter,
  CompletionModelInput,
  CompletionModelResult
} from "./base.js";
import { OpenAIAdapter } from "./openai.js";

export * from "./base.js";
export * from "./openai.js";

export type AdapterFactoryOptions = {
  apiKey: string;
  model: string;
  fallbackModel?: string;
  baseUrl?: string;
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
  extraBody?: Record<string, unknown>;
};

class FallbackAdapter implements CompletionModelAdapter {
  constructor(
    private readonly primary: CompletionModelAdapter,
    private readonly secondary?: CompletionModelAdapter
  ) {}

  private isRetryableError(error: unknown): boolean {
    return error !== undefined;
  }

  async complete(input: CompletionModelInput): Promise<CompletionModelResult> {
    try {
      return await this.primary.complete(input);
    } catch (error) {
      if (!this.secondary || !this.isRetryableError(error)) {
        throw error;
      }
      return this.secondary.complete(input);
    }
  }
}

export function createAdapter(options: AdapterFactoryOptions): CompletionModelAdapter {
  const primary = new OpenAIAdapter({
    apiKey: options.apiKey,
    model: options.model,
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs,
    extraHeaders: options.extraHeaders,
    extraBody: options.extraBody
  });

  const secondary = options.fallbackModel
    ? new OpenAIAdapter({
        apiKey: options.apiKey,
        model: options.fallbackModel,
        baseUrl: options.baseUrl,
        timeoutMs: options.timeoutMs,
        extraHeaders: options.extraHeaders,
        extraBody: options.extraBody
      })
    : undefined;

  return new FallbackAdapter(primary, secondary);
}
