import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildApp } from "../../app.js";
import { DATA_DIR } from "../core/config.js";
import { createUserJsonRepository } from "../auth/infra/user-json-repository.js";
import { createProjectJsonRepository } from "../projects/infra/project-json-repository.js";
import { createSpaceJsonRepository } from "../spaces/infra/space-json-repository.js";
import { createCloudFileStore } from "./infra/cloud-file-store.js";
import { auth } from "../../test-utils.js";

// A tiny PTS1 file (header + 2 points) so the test doesn't depend on the 30 MB generated cloud.
function tinyCloud(): Buffer {
  const buf = Buffer.alloc(16 + 2 * 16);
  buf.write("PTS1", 0, "ascii");
  buf.writeUInt32LE(2, 4);
  buf.writeFloatLE(0.02, 8);
  return buf;
}

// Rule 7: Range bytes=0-15 → 206 with the 16 header bytes; a project without a cloud → 404.
describe("point cloud (rule 7)", () => {
  let tmp: string;
  let app: Awaited<ReturnType<typeof buildApp>>;
  const file = tinyCloud();

  beforeAll(async () => {
    tmp = await mkdtemp(path.join(tmpdir(), "svl-"));
    await mkdir(path.join(tmp, "clouds"));
    // Only 1201-30001 gets a file; 1201-30002 declares one that was never generated.
    await writeFile(path.join(tmp, "clouds", "1201-30001.pts"), file);
    app = buildApp({
      users: await createUserJsonRepository(DATA_DIR),
      projects: await createProjectJsonRepository(DATA_DIR),
      spaces: createSpaceJsonRepository(DATA_DIR),
      clouds: createCloudFileStore(tmp),
    });
  });
  afterAll(() => rm(tmp, { recursive: true, force: true }));

  const get = (
    id: string,
    token: string,
    headers: Record<string, string> = {},
  ) =>
    app.inject({
      url: `/api/projects/${id}/cloud`,
      headers: { ...auth(token), ...headers },
    });

  it("Range bytes=0-15 → 206 with exactly the 16 header bytes", async () => {
    const res = await get("1201-30001", "acme-token", { range: "bytes=0-15" });
    expect(res.statusCode).toBe(206);
    expect(res.headers["content-range"]).toBe(`bytes 0-15/${file.length}`);
    expect(res.headers["content-length"]).toBe("16");
    expect(res.rawPayload).toEqual(file.subarray(0, 16));
    expect(res.rawPayload.subarray(0, 4).toString("ascii")).toBe("PTS1");
  });

  it("no Range → 200 with the whole file, binary and private", async () => {
    const res = await get("1201-30001", "acme-token");
    expect(res.statusCode).toBe(200);
    expect(res.headers["accept-ranges"]).toBe("bytes");
    expect(res.headers["content-type"]).toBe("application/octet-stream");
    expect(res.headers["cache-control"]).toBe("private, no-cache");
    expect(res.rawPayload).toEqual(file);
  });

  it("a range past the end → 416", async () => {
    expect(
      (await get("1201-30001", "acme-token", { range: "bytes=9999-" }))
        .statusCode,
    ).toBe(416);
  });

  it("project without cloud (null) → 404", async () => {
    const res = await get("0980-41007", "brick-token");
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: "Not Found",
      message: "This project has no point cloud",
    });
  });

  it("cloud declared but file missing → 404, not 500", async () => {
    expect((await get("1201-30002", "acme-token")).statusCode).toBe(404);
  });

  it("rule 4: another client’s cloud looks exactly like a missing project", async () => {
    const foreign = await get("1201-30001", "brick-token", {
      range: "bytes=0-15",
    });
    const missing = await get("9999-99999", "brick-token", {
      range: "bytes=0-15",
    });
    expect(foreign.statusCode).toBe(404);
    expect(foreign.body).toBe(missing.body);
  });

  it("rule 5: malformed id → 400", async () => {
    expect((await get("..%2Fusers", "staff-token")).statusCode).toBe(400);
  });
});
