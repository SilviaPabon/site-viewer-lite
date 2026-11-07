import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, auth } from "../../test-utils.js";

const URL = "/api/projects/1201-30001/issues";

describe("POST /projects/:id/issues", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildTestApp();
  });

  const post = (
    payload: unknown,
    { token = "acme-token", url = URL, raw = false } = {},
  ) =>
    app.inject({
      method: "POST",
      url,
      headers: { ...auth(token), "content-type": "application/json" },
      payload: raw ? (payload as string) : JSON.stringify(payload),
    });

  it("creates a report and answers 201 with its id", async () => {
    const res = await post({
      title: "Crack in wall",
      level: "Level 1",
      spaceId: "s1",
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ id: expect.any(String) });
  });

  it("spaceId is optional", async () => {
    expect((await post({ title: "Leak", level: "Level 2" })).statusCode).toBe(
      201,
    );
  });

  it("accepts a 120-character title", async () => {
    expect(
      (await post({ title: "x".repeat(120), level: "Level 1" })).statusCode,
    ).toBe(201);
  });

  // Rule 5: invalid bodies and broken JSON are 4xx, never 500.
  it.each([
    ["empty title", { title: "", level: "Level 1" }],
    ["blank title", { title: "   ", level: "Level 1" }],
    ["121-char title", { title: "x".repeat(121), level: "Level 1" }],
    ["missing title", { level: "Level 1" }],
    ["missing level", { title: "Leak" }],
    ["level not in project", { title: "Leak", level: "Roof" }],
    ["unknown space", { title: "Leak", level: "Level 1", spaceId: "zz" }],
    [
      "space on another level",
      { title: "Leak", level: "Level 2", spaceId: "s1" },
    ],
    ["number title (no coercion)", { title: 123, level: "Level 1" }],
    ["null title", { title: null, level: "Level 1" }],
    ["array body", [1, 2]],
    ["string body", "hello"],
    ["null body", null],
  ])("rule 5: %s → 400", async (_, body) => {
    const res = await post(body);
    expect(res.statusCode).toBe(400);
  });

  it.each([
    ["broken JSON", '{"title": "Leak", '],
    ["empty body", ""],
    ["trailing garbage", '{"title":"a","level":"Level 1"}xx'],
  ])("rule 5: %s → 400", async (_, raw) => {
    expect((await post(raw, { raw: true })).statusCode).toBe(400);
  });

  it("returns readable messages for domain errors", async () => {
    const res = await post({ title: "Leak", level: "Roof" });
    expect(res.json()).toEqual({
      error: "Bad Request",
      message: "Level does not exist in this project",
    });
  });

  it("wrong content type → 415, oversized body → 413", async () => {
    const text = await app.inject({
      method: "POST",
      url: URL,
      headers: { ...auth("acme-token"), "content-type": "application/xml" },
      payload: "<a/>",
    });
    expect(text.statusCode).toBe(415);
    expect(
      (await post({ title: "x", level: "Level 1", pad: "y".repeat(5000) }))
        .statusCode,
    ).toBe(413);
  });

  it("malformed project id → 400", async () => {
    const res = await post(
      { title: "Leak", level: "Level 1" },
      { url: "/api/projects/abc/issues" },
    );
    expect(res.statusCode).toBe(400);
  });

  // Rule 4: another client's project, even with a valid body, is the same 404 as a missing one.
  it("rule 4: foreign project → same 404 as missing, body never evaluated", async () => {
    const body = { title: "Leak", level: "Level 1" };
    const foreign = await post(body, { token: "brick-token" });
    const missing = await post(body, {
      token: "brick-token",
      url: "/api/projects/9999-99999/issues",
    });
    expect(foreign.statusCode).toBe(404);
    expect(foreign.body).toBe(missing.body);
    // An invalid level must not reveal which levels the foreign project has.
    expect(
      (await post({ title: "x", level: "Roof" }, { token: "brick-token" }))
        .statusCode,
    ).toBe(404);
  });

  it("no token → 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: URL,
      payload: { title: "a", level: "Level 1" },
    });
    expect(res.statusCode).toBe(401);
  });
});
