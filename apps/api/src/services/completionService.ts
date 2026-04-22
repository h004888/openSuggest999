import { createHash } from "node:crypto";
import type { CompletionModelAdapter } from "@opensuggest/model-adapter";
import type {
  InlineCompletionRequest,
  InlineCompletionResponse
} from "@opensuggest/shared-types";
import { CacheService } from "./cacheService.js";
import { buildInlinePrompt } from "./promptBuilder.js";
import { TelemetryService } from "./telemetryService.js";

type CompletionServiceOptions = {
  adapter: CompletionModelAdapter;
  cache: CacheService<InlineCompletionResponse>;
  telemetry: TelemetryService;
  modelName: string;
};

const MAX_SUGGESTION_CHARS = 120;
const THINKING_TOKEN_PATTERN = /<\/?think>|<thinking>|<\/thinking>/gi;
const PROSE_PREFIX_PATTERN = /^(the user wants|looking at|i should|here is|this code|the completion|we need to)/i;

function extractJsonCompletion(raw: string): string | null {
  const trimmed = raw.trim();
  const fencedJsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fencedJsonMatch?.[1] ?? trimmed;

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      typeof (parsed as { completion?: unknown }).completion === "string"
    ) {
      return (parsed as { completion: string }).completion;
    }
  } catch {
    return null;
  }

  return null;
}

function trimInlineSuggestion(raw: string): string {
  const jsonCompletion = extractJsonCompletion(raw);
  const normalized = (jsonCompletion ?? raw)
    .replace(/\r\n/g, "\n")
    .replace(THINKING_TOKEN_PATTERN, "")
    .trim();
  if (!normalized) {
    return "";
  }

  const firstLine = normalized.split("\n")[0]?.trim() ?? "";
  if (!firstLine || PROSE_PREFIX_PATTERN.test(firstLine)) {
    return "";
  }

  return firstLine.slice(0, MAX_SUGGESTION_CHARS).trimEnd();
}

function removeDuplicatedPrefix(prefix: string, suggestion: string): string {
  const trimmedPrefix = prefix.trimEnd();
  if (!trimmedPrefix) {
    return suggestion;
  }

  const prefixTail = trimmedPrefix.split(/\s+/).at(-1) ?? trimmedPrefix;
  if (!prefixTail) {
    return suggestion;
  }

  return suggestion.startsWith(prefixTail)
    ? suggestion.slice(prefixTail.length).trimStart()
    : suggestion;
}

export function normalizeInlineSuggestion(prefix: string, raw: string): string {
  return trimInlineSuggestion(removeDuplicatedPrefix(prefix, raw));
}

export class CompletionService {
  constructor(private readonly options: CompletionServiceOptions) {}

  async complete(request: InlineCompletionRequest): Promise<InlineCompletionResponse> {
    const cacheKey = this.buildCacheKey(request);
    const cached = this.options.cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const start = Date.now();
    const prompt = buildInlinePrompt(request);
    const modelResult = await this.options.adapter.complete({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      maxTokens: 48,
      temperature: 0.1,
      requestId: request.requestId
    });

    const latencyMs = Date.now() - start;
    const response: InlineCompletionResponse = {
      suggestion: normalizeInlineSuggestion(request.prefix, modelResult.suggestion),
      stopReason: modelResult.stopReason,
      model: modelResult.model ?? this.options.modelName,
      latencyMs,
      cached: false
    };

    this.options.cache.set(cacheKey, response);
    this.options.telemetry.recordCompletion({
      requestId: request.requestId,
      language: request.language,
      filePath: request.filePath,
      latencyMs: response.latencyMs,
      model: response.model,
      cached: response.cached,
      suggestionLength: response.suggestion.length,
      suggestionPreview: response.suggestion
    });

    return response;
  }

  private buildCacheKey(request: InlineCompletionRequest): string {
    const digest = createHash("sha256")
      .update(request.language)
      .update("|")
      .update(request.prefix.slice(-700))
      .update("|")
      .update(request.suffix.slice(0, 300))
      .digest("hex");

    return digest;
  }
}
