import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { TelemetryService } from "../services/telemetryService.js";

const FeedbackSchema = z.object({
  requestId: z.string(),
  language: z.string(),
  filePath: z.string(),
  accepted: z.boolean(),
  suggestionLength: z.number()
});

type FeedbackRequest = z.infer<typeof FeedbackSchema>;

type RegisterFeedbackRouteOptions = {
  telemetry: TelemetryService;
};

export async function registerFeedbackRoute(
  app: FastifyInstance,
  options: RegisterFeedbackRouteOptions
): Promise<void> {
  app.post("/v1/completions/feedback", async (request, reply) => {
    const parsed = FeedbackSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid feedback data"
        }
      });
      return;
    }

    const feedback = parsed.data;
    options.telemetry.recordFeedback({
      requestId: feedback.requestId,
      language: feedback.language,
      filePath: feedback.filePath,
      accepted: feedback.accepted,
      suggestionLength: feedback.suggestionLength
    });

    reply.send({ ok: true });
  });
}
