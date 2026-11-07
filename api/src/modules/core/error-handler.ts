import { STATUS_CODES } from "node:http";
import type { FastifyError, FastifyInstance } from "fastify";

// Every error leaves the API as { error, message }. Client mistakes (4xx) keep a useful message;
// anything else is a 500 with a generic text, and the real cause only goes to the server log.
export function registerErrorHandling(app: FastifyInstance) {
  app.setErrorHandler((err: FastifyError, request, reply) => {
    const status =
      err.statusCode && err.statusCode >= 400 && err.statusCode < 500
        ? err.statusCode
        : 500;

    if (status === 500) {
      request.log.error({ err }, "unhandled error");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }

    // Params only carry the project id; don't echo the regex back.
    const message =
      err.validation && err.validationContext === "params"
        ? "Invalid project id"
        : err.message;
    return reply.code(status).send({ error: STATUS_CODES[status], message });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({ error: "Not Found", message: "Route not found" }),
  );
}
