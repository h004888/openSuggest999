import type { FastifyInstance } from "fastify";
import {
  InlineCompletionRequestSchema,
  InlineCompletionResponseSchema
} from "@opensuggest/shared-types";
import type { CompletionService } from "../services/completionService.js";

type RegisterInlineRouteOptions = {
  completionService: CompletionService;
};

export async function registerInlineCompletionRoute(
  app: FastifyInstance,
  options: RegisterInlineRouteOptions
): Promise<void> {
  app.post("/v1/completions/inline", async (request, reply) => {
    const parsed = InlineCompletionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMessages = Object.entries(fieldErrors)
        .flatMap(([field, errors]) => (errors as string[]).map(e => `${field}: ${e}`));
      reply.code(400).send({
        error: {
          code: "BAD_REQUEST",
          message: errorMessages.join("; ") || "Invalid request"
        }
      });
      return;
    }

    const response = await options.completionService.complete(parsed.data);
    const checked = InlineCompletionResponseSchema.parse(response);
    reply.send(checked);
  });
}
