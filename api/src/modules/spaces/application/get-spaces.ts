import type { User } from '../../auth/domain/user.js';
import { findVisibleProject, type ProjectRepository } from '../../projects/index.js';
import type { Space, SpaceRepository } from '../domain/space.js';

// undefined = project not visible (or missing): the route answers 404, same as /projects/:id.
export async function getSpaces(
  projects: ProjectRepository,
  spaces: SpaceRepository,
  user: User,
  projectId: string,
): Promise<Space[] | undefined> {
  const project = findVisibleProject(projects, user, projectId);
  return project && spaces.findByProjectId(project.id);
}
