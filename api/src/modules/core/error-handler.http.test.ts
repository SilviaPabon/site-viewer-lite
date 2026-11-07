import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, auth } from "../../test-utils.js";

// Every error has the same shape, and server faults never leak their cause.
describe("error handling", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildTestApp();
    // Test-only route that blows up like a bug would.
    app.get("/api/boom", async () => {
      throw new Error("secret: db password is hunter2");
    });
  });

  const req = (
    method: "GET" | "POST",
    url: string,
    payload?: string,
    contentType = "application/json",
  ) =>
    app.inject({
      method,
      url,
      payload,
      headers: { ...auth("staff-token"), "content-type": contentType },
    });

  it.each([
    ["bad id", "GET", "/api/projects/abc", undefined, undefined, 400],
    [
      "broken JSON",
      "POST",
      "/api/projects/1201-30001/issues",
      "{oops",
      undefined,
      400,
    ],
    [
      "invalid body",
      "POST",
      "/api/projects/1201-30001/issues",
      '{"title":""}',
      undefined,
      400,
    ],
    [
      "unsupported type",
      "POST",
      "/api/projects/1201-30001/issues",
      "<a/>",
      "application/xml",
      415,
    ],
    [
      "too large",
      "POST",
      "/api/projects/1201-30001/issues",
      JSON.stringify({ t: "x".repeat(5000) }),
      undefined,
      413,
    ],
    ["unknown route", "GET", "/api/nope", undefined, undefined, 404],
  ] as const)(
    "%s → %i as { error, message }",
    async (_, method, url, payload, type, status) => {
      const res = await req(method, url, payload, type);
      expect(res.statusCode).toBe(status);
      expect(Object.keys(res.json()).sort()).toEqual(["error", "message"]);
      expect(res.body).not.toMatch(/FST_|statusCode|code/);
    },
  );

  it("a bad id doesn't echo the validation regex", async () => {
    expect((await req("GET", "/api/projects/abc")).json()).toEqual({
      error: "Bad Request",
      message: "Invalid project id",
    });
  });

  it("an invalid body says what is wrong", async () => {
    const res = await req(
      "POST",
      "/api/projects/1201-30001/issues",
      '{"title":"","level":"Level 1"}',
    );
    expect(res.json().message).toMatch(/title/);
  });

  it("an unexpected error → generic 500, no cause or stack", async () => {
    const res = await req("GET", "/api/boom");
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: "Internal Server Error",
      message: "Something went wrong",
    });
    expect(res.body).not.toMatch(/secret|hunter2|at /);
  });

  it("unknown routes still need a token", async () => {
    expect((await app.inject({ url: "/api/nope" })).statusCode).toBe(401);
  });
});
