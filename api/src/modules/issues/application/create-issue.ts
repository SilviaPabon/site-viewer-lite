import { randomUUID } from "node:crypto";
import type { User } from "../../auth/domain/user.js";
import {
  findVisibleProject,
  type ProjectRepository,
} from "../../projects/index.js";
import type { SpaceRepository } from "../../spaces/index.js";
import {
  validateIssue,
  type IssueRepository,
  type NewIssueBody,
} from "../domain/issue.js";

export type CreateIssueResult =
  | { kind: "project-not-found" }
  | { kind: "invalid"; message: string }
  | { kind: "created"; id: string };

export async function createIssue(
  deps: {
    projects: ProjectRepository;
    spaces: SpaceRepository;
    issues: IssueRepository;
  },
  user: User,
  projectId: string,
  body: NewIssueBody,
): Promise<CreateIssueResult> {
  // Rule 4 first: a foreign project is "not found" before we say anything about the body.
  const project = findVisibleProject(deps.projects, user, projectId);
  if (!project) return { kind: "project-not-found" };

  const spaces =
    body.spaceId === undefined
      ? []
      : await deps.spaces.findByProjectId(project.id);
  const check = validateIssue(body, project.levels, spaces);
  if (!check.ok) return { kind: "invalid", message: check.message };

  const id = randomUUID();
  await deps.issues.save({
    id,
    projectId: project.id,
    title: check.title,
    level: body.level,
    ...(body.spaceId !== undefined && { spaceId: body.spaceId }),
    createdBy: user.name,
    createdAt: new Date().toISOString(),
  });
  return { kind: "created", id };
}
