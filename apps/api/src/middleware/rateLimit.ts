import type { FastifyReply, FastifyRequest } from "fastify";

type Counter = {
  count: number;
  resetAt: number;
};

export function createRateLimitMiddleware(limitPerMinute: number) {
  const counters = new Map<string, Counter>();

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, counter] of counters.entries()) {
      if (counter.resetAt <= now) {
        counters.delete(key);
      }
    }
  }, 60_000);

  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.url === "/health") {
      return;
    }

    const key =
      (request.headers["x-api-key"] as string | undefined) ??
      request.ip ??
      "anonymous";

    const now = Date.now();
    const current = counters.get(key);
    if (!current || current.resetAt <= now) {
      counters.set(key, {
        count: 1,
        resetAt: now + 60_000
      });
      return;
    }

    if (current.count >= limitPerMinute) {
      reply.code(429).send({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests"
        }
      });
      return;
    }

    current.count += 1;
    counters.set(key, current);
  };
}
