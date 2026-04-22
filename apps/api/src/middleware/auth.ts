import type { FastifyReply, FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";

// Simple logger using console
const log = {
  debug: (...args: unknown[]) => console.debug("[auth]", ...args),
  info: (...args: unknown[]) => console.info("[auth]", ...args),
  warn: (...args: unknown[]) => console.warn("[auth]", ...args),
  error: (...args: unknown[]) => console.error("[auth]", ...args),
};

export function createAuthMiddleware(requiredApiKey?: string) {
  return async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    log.debug({ url: request.url }, "Auth middleware checking");

    if (request.url === "/health") {
      return;
    }

    if (!requiredApiKey) {
      log.debug({ url: request.url }, "No API key required, skipping auth");
      return;
    }

    const rawApiKey = request.headers["x-api-key"];
    const providedApiKey = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey;
    const hasProvidedKey = !!providedApiKey;

    log.info({
      url: request.url,
      hasProvidedKey,
      expectedKeyLength: requiredApiKey.length
    }, "Auth check");

    if (!providedApiKey) {
      log.warn({ url: request.url }, "Auth failed - no API key provided");
      reply.code(401).send({
        error: { code: "UNAUTHORIZED", message: "Invalid API key" }
      });
      return;
    }

    let keyMatch = false;
    try {
      keyMatch = providedApiKey.length === requiredApiKey.length &&
        timingSafeEqual(Buffer.from(providedApiKey), Buffer.from(requiredApiKey));
    } catch {
      keyMatch = false;
    }

    if (!keyMatch) {
      log.warn({ url: request.url, hasProvidedKey }, "Auth failed - invalid API key");
      reply.code(401).send({
        error: { code: "UNAUTHORIZED", message: "Invalid API key" }
      });
      return;
    }

    log.debug({ url: request.url }, "Auth passed");
  };
}