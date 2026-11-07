import Fastify from 'fastify';
import type { UserRepository } from './modules/auth/domain/user.js';
import type { ProjectRepository } from './modules/projects/domain/project.js';
import type { SpaceRepository } from './modules/spaces/domain/space.js';
import { registerAuth } from './modules/auth/infra/auth-hook.js';
import { projectRoutes } from './modules/projects/infra/routes.js';
import { spaceRoutes } from './modules/spaces/infra/routes.js';

export type Repos = { users: UserRepository; projects: ProjectRepository; spaces: SpaceRepository };

// Builds the app without listening, so tests can drive it with app.inject().
// Dependencies come in by hand: no DI container (ADR-004).
export function buildApp(repos: Repos) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  // Auth goes first: route plugins registered after it inherit the hook.
  registerAuth(app, repos.users);
  app.register(projectRoutes, { projects: repos.projects });
  app.register(spaceRoutes, { projects: repos.projects, spaces: repos.spaces });

  return app;
}
