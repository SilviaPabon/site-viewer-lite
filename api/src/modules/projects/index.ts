// Public surface of the projects module for other modules.
export type { Project, ProjectRepository } from './domain/project.js';
export { findVisibleProject } from './application/project-queries.js';
