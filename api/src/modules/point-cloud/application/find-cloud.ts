import type { User } from "../../auth/domain/user.js";
import {
  findVisibleProject,
  type ProjectRepository,
} from "../../projects/index.js";
import type { CloudStore } from "../domain/cloud.js";

export type CloudLookup =
  | { kind: "project-not-found" } // missing or not visible: same answer as every other /projects/:id route
  | { kind: "no-cloud" } // the project exists for this user but has no point cloud (rule 7)
  | { kind: "found"; dir: string; file: string };

export async function findCloud(
  projects: ProjectRepository,
  clouds: CloudStore,
  user: User,
  projectId: string,
): Promise<CloudLookup> {
  const project = findVisibleProject(projects, user, projectId);
  if (!project) return { kind: "project-not-found" };
  if (!project.cloud) return { kind: "no-cloud" };

  const located = await clouds.locate(project.cloud);
  return located ? { kind: "found", ...located } : { kind: "no-cloud" };
}
