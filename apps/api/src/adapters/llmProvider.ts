import { createAdapter } from "@opensuggest/model-adapter";
import type { AppEnv } from "../config/env.js";

export function createLlmProvider(env: AppEnv) {
  return createAdapter({
    apiKey: env.openaiApiKey,
    model: env.model,
    fallbackModel: env.fallbackModel,
    baseUrl: env.openaiBaseUrl,
    timeoutMs: env.timeoutMs,
    extraHeaders: env.openaiExtraHeaders,
    extraBody: env.openaiExtraBody
  });
}
