import type { FastifyInstance } from "fastify";
import type { User, UserRepository } from "../domain/user.js";
import { authenticate } from "../application/authenticate.js";

declare module "fastify" {
  interface FastifyRequest {
    // Always set by the hook below before any handler runs.
    user: User;
  }
}

// Registered directly on the root instance (not with app.register) so it covers every route.
export function registerAuth(app: FastifyInstance, users: UserRepository) {
  // Fastify recommends declaring decorators up front (keeps request objects the same shape, which V8 likes).
  app.decorateRequest("user", null as never);

  app.addHook("onRequest", async (request, reply) => {
    const user = authenticate(users, request.headers.authorization);
    if (!user) {
      return reply.code(401).header("WWW-Authenticate", "Bearer").send({
        error: "Unauthorized",
        message: "Missing or invalid bearer token",
      });
    }
    request.user = user;
  });
}
