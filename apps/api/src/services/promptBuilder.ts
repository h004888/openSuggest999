import { buildPrompt } from "@opensuggest/prompt-kit";
import type { InlineCompletionRequest } from "@opensuggest/shared-types";

export function buildInlinePrompt(request: InlineCompletionRequest) {
  return buildPrompt({
    language: request.language,
    filePath: request.filePath,
    prefix: request.prefix,
    suffix: request.suffix
  });
}
