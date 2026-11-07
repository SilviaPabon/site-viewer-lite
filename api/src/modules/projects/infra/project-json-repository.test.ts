import { describe, it, expect } from "vitest";
import { DATA_DIR } from "../../core/config.js";
import { createProjectJsonRepository } from "./project-json-repository.js";

describe("ProjectJsonRepository", async () => {
  const repo = await createProjectJsonRepository(DATA_DIR);

  it("loads every project from the kit", () => {
    expect(repo.findAll().map((p) => p.id)).toEqual([
      "1201-30001",
      "1201-30002",
      "0980-41007",
    ]);
  });

  it("never hands over the internal block, at runtime", () => {
    const text = JSON.stringify(repo.findAll());
    expect(text).not.toMatch(/internal|price|invoice|margin|notes/);
  });

  it("returns undefined for an unknown id", () => {
    expect(repo.findById("9999-99999")).toBeUndefined();
  });
});
