import { stat } from "node:fs/promises";
import path from "node:path";
import type { CloudStore } from "../domain/cloud.js";

export function createCloudFileStore(dataDir: string): CloudStore {
  const dir = path.join(dataDir, "clouds");
  return {
    async locate(fileName) {
      // The name comes from projects.json, not from the request; basename is a second guard against "../".
      const file = path.basename(fileName);
      try {
        return (await stat(path.join(dir, file))).isFile()
          ? { dir, file }
          : undefined;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
        throw err;
      }
    },
  };
}
