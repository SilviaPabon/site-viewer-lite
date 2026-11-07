import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, auth } from "../../test-utils.js";

// Rule 1: no token or an invalid token → 401.
describe("auth (rule 1)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
    // Test-only route: the real ones arrive in later steps.
    app.get("/api/whoami", async (request) => ({
      name: request.user.name,
      role: request.user.role,
    }));
  });

  const get = (headers: Record<string, string> = {}) =>
    app.inject({ method: "GET", url: "/api/whoami", headers });

  it.each([
    ["no header", {}],
    ["unknown token", auth("nope")],
    ["wrong scheme", { authorization: "Basic acme-token" }],
    ["empty bearer", { authorization: "Bearer " }],
    ["extra parts", { authorization: "Bearer acme-token extra" }],
  ])("%s → 401", async (_, headers) => {
    const res = await get(headers);
    expect(res.statusCode).toBe(401);
    expect(res.headers["www-authenticate"]).toBe("Bearer");
    expect(res.json()).toEqual({
      error: "Unauthorized",
      message: "Missing or invalid bearer token",
    });
  });

  it("valid token reaches the handler with its user", async () => {
    const res = await get(auth("acme-token"));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ name: "Sam Lee", role: "client" });
  });

  it.each([
    ["GET", "/api/projects"],
    ["GET", "/api/projects/1201-30001"],
    ["GET", "/api/projects/1201-30001/spaces"],
    ["GET", "/api/projects/1201-30001/cloud"],
    ["POST", "/api/projects/1201-30001/issues"],
  ] as const)(
    "every real route: %s %s without token → 401",
    async (method, url) => {
      const res = await app.inject({
        method,
        url,
        payload: method === "POST" ? {} : undefined,
      });
      expect(res.statusCode).toBe(401);
    },
  );

  it("unknown routes also need a token (no route discovery)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/nothing-here" });
    expect(res.statusCode).toBe(401);
  });
});
