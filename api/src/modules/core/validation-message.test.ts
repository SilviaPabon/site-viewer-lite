import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, auth } from "../../test-utils.js";

// Readable messages for the issue form: what Ajv says → what the viewer shows.
describe("validation messages", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildTestApp();
  });

  it.each([
    ['{"title":"","level":"Level 1"}', "Title is required"],
    ['{"level":"Level 1"}', "Title is required"],
    ['{"title":"Leak"}', "Level is required"],
    [
      `{"title":"${"x".repeat(121)}","level":"Level 1"}`,
      "Title must be at most 120 characters",
    ],
    ['{"title":5,"level":"Level 1"}', "Title must be text"],
    ['{"title":"Leak","level":"Level 1","spaceId":""}', "SpaceId is required"],
    ["[1]", "Request body must be a JSON object"],
  ])("%s → %j", async (payload, message) => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projects/1201-30001/issues",
      headers: { ...auth("acme-token"), "content-type": "application/json" },
      payload,
    });
    expect(res.json()).toEqual({ error: "Bad Request", message });
  });
});
