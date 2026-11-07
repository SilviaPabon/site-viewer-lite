import type { User } from '../../auth/domain/user.js';
import type { Project, ProjectRepository } from '../domain/project.js';
import { canSee, toProjectDetail, toProjectSummary, type ProjectDetail, type ProjectSummary } from '../domain/policies.js';

export function listProjects(repo: ProjectRepository, user: User): ProjectSummary[] {
  return repo.findAll().filter((p) => canSee(user, p)).map(toProjectSummary);
}

// Rule 4: a project the user can't see is reported exactly like one that doesn't exist.
// Other modules (spaces, cloud, issues) go through here so they share that rule.
export function findVisibleProject(repo: ProjectRepository, user: User, id: string): Project | undefined {
  const project = repo.findById(id);
  return project && canSee(user, project) ? project : undefined;
}

export function getProject(repo: ProjectRepository, user: User, id: string): ProjectDetail | undefined {
  const project = findVisibleProject(repo, user, id);
  return project && toProjectDetail(project, user);
}
