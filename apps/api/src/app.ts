import Fastify from "fastify";
import { createLlmProvider } from "./adapters/llmProvider.js";
import { getEnv } from "./config/env.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { registerErrorHandler } from "./middleware/errorHandler.js";
import { createRateLimitMiddleware } from "./middleware/rateLimit.js";
import { registerFeedbackRoute } from "./routes/feedback.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerInlineCompletionRoute } from "./routes/inlineCompletion.js";
import { CacheService } from "./services/cacheService.js";
import { CompletionService } from "./services/completionService.js";
import { TelemetryService } from "./services/telemetryService.js";
import type { InlineCompletionResponse } from "@opensuggest/shared-types";

export function createApp() {
  const env = getEnv();
  const app = Fastify({ logger: true });

  const auth = createAuthMiddleware(env.appApiKey);
  const rateLimit = createRateLimitMiddleware(env.rateLimitPerMin);

  app.addHook("preHandler", auth);
  app.addHook("preHandler", rateLimit);

  const llmAdapter = createLlmProvider(env);
  const cache = new CacheService<InlineCompletionResponse>(env.cacheTtlMs);
  const telemetry = new TelemetryService({ enabled: true });
  const completionService = new CompletionService({
    adapter: llmAdapter,
    cache,
    telemetry,
    modelName: env.model
  });

  registerErrorHandler(app);
  void registerHealthRoute(app);
  void registerInlineCompletionRoute(app, {
    completionService
  });
  void registerFeedbackRoute(app, {
    telemetry
  });

  return {
    app,
    env
  };
}
