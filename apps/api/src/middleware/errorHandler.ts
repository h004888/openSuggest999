import type { FastifyInstance } from "fastify";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error"
      }
    });
  });
}
