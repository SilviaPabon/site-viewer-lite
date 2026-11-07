import Fastify from 'fastify';
import type { UserRepository } from './modules/auth/domain/user.js';
import type { ProjectRepository } from './modules/projects/domain/project.js';
import { registerAuth } from './modules/auth/infra/auth-hook.js';

export type Repos = { users: UserRepository; projects: ProjectRepository };

// Builds the app without listening, so tests can drive it with app.inject().
// Dependencies come in by hand: no DI container (ADR-004).
export function buildApp(repos: Repos) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  registerAuth(app, repos.users);

  return app;
}
