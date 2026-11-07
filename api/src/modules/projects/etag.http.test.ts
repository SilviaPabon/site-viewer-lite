import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, auth } from "../../test-utils.js";
import { ifNoneMatchHits } from "../core/etag.js";

// Rule 6: cheap revalidation with ETag + 304, and per-user responses kept out of shared caches.
describe("project detail revalidation (rule 6)", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildTestApp();
  });
  const get = (token: string, ifNoneMatch?: string) =>
    app.inject({
      url: "/api/projects/1201-30001",
      headers: {
        ...auth(token),
        ...(ifNoneMatch && { "if-none-match": ifNoneMatch }),
      },
    });

  it("200 carries an ETag and private caching headers", async () => {
    const res = await get("acme-token");
    expect(res.statusCode).toBe(200);
    expect(res.headers.etag).toMatch(/^"[\w-]+"$/);
    expect(res.headers["cache-control"]).toBe("private, no-cache");
    expect(res.headers.vary).toBe("Authorization");
  });

  it("same ETag back → 304 with no body and the same headers", async () => {
    const { headers } = await get("acme-token");
    const res = await get("acme-token", headers.etag as string);
    expect(res.statusCode).toBe(304);
    expect(res.body).toBe("");
    expect(res.headers.etag).toBe(headers.etag);
    expect(res.headers["cache-control"]).toBe("private, no-cache");
  });

  it("the ETag differs by what each user sees (staff gets contact details)", async () => {
    const staff = (await get("staff-token")).headers.etag as string;
    const client = (await get("acme-token")).headers.etag as string;
    expect(staff).not.toBe(client);
    // A client replaying the staff ETag gets the full 200, never a 304 for content it doesn't hold.
    expect((await get("acme-token", staff)).statusCode).toBe(200);
  });

  it("stale ETag → 200", async () => {
    expect((await get("acme-token", '"old"')).statusCode).toBe(200);
  });

  it('a 404 never becomes a 304, even with "*"', async () => {
    const res = await app.inject({
      url: "/api/projects/1201-30001",
      headers: { ...auth("brick-token"), "if-none-match": "*" },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("ifNoneMatchHits", () => {
  it.each([
    ['"a"', true],
    ['W/"a"', true],
    ['"x", "a"', true],
    ["*", true],
    ['"b"', false],
    ["", false],
    [undefined, false],
  ])('%j vs "a" → %s', (header, hit) => {
    expect(ifNoneMatchHits(header, '"a"')).toBe(hit);
  });
});
