// Generates the point clouds the viewer needs, only when they are missing (runs before `npm run dev`).
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const kit = path.resolve(import.meta.dirname, "../site-viewer-lite-starter");
const clouds = [
  ["1201-30001.pts", ["1201-30001"]],
  ["1201-30002.pts", ["1201-30002", "400000"]],
  ["1201-30001-truncated.pts", ["1201-30001", "2000000", "--truncate"]],
];

for (const [file, args] of clouds) {
  if (existsSync(path.join(kit, "data/clouds", file))) continue;
  execFileSync(
    process.execPath,
    [path.join(kit, "tools/make-cloud.js"), ...args],
    {
      stdio: "inherit",
    },
  );
}
