export type InlineCompletionRequest = {
  language: string;
  filePath: string;
  cursor: {
    line: number;
    character: number;
  };
  prefix: string;
  suffix: string;
  editor?: string;
  requestId?: string;
};

export type InlineCompletionResponse = {
  suggestion: string;
  model: string;
  latencyMs: number;
  cached: boolean;
  stopReason?: string;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

export const isInlineCompletionResponse = (
  value: unknown
): value is InlineCompletionResponse => {
  if (!isObject(value)) {
    return false;
  }

  const hasSuggestion = typeof value.suggestion === "string";
  const hasModel = typeof value.model === "string";
  const hasLatency = typeof value.latencyMs === "number" && Number.isFinite(value.latencyMs);
  const hasCached = typeof value.cached === "boolean";
  const hasValidStopReason =
    typeof value.stopReason === "undefined" || typeof value.stopReason === "string";

  return hasSuggestion && hasModel && hasLatency && hasCached && hasValidStopReason;
};
