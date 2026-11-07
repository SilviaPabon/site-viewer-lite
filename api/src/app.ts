import Fastify from "fastify";
import type { UserRepository } from "./modules/auth/domain/user.js";
import type { ProjectRepository } from "./modules/projects/domain/project.js";
import type { SpaceRepository } from "./modules/spaces/domain/space.js";
import type { CloudStore } from "./modules/point-cloud/domain/cloud.js";
import { registerAuth } from "./modules/auth/infra/auth-hook.js";
import { registerErrorHandling } from "./modules/core/error-handler.js";
import { projectRoutes } from "./modules/projects/infra/routes.js";
import { spaceRoutes } from "./modules/spaces/infra/routes.js";
import { pointCloudRoutes } from "./modules/point-cloud/infra/routes.js";
import { issueRoutes } from "./modules/issues/infra/routes.js";
import type { IssueRepository } from "./modules/issues/domain/issue.js";

export type Repos = {
  users: UserRepository;
  projects: ProjectRepository;
  spaces: SpaceRepository;
  clouds: CloudStore;
  issues: IssueRepository;
};

// Builds the app without listening, so tests can drive it with app.inject().
// Dependencies come in by hand: no DI container (ADR-004).
export function buildApp(repos: Repos) {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
    // Fastify coerces types by default ({ title: 123 } would become "123"). We want a 400 instead.
    ajv: { customOptions: { coerceTypes: false } },
  });

  // Error handling and auth go first: route plugins registered after them inherit both.
  registerErrorHandling(app);
  registerAuth(app, repos.users);
  app.register(projectRoutes, { projects: repos.projects });
  app.register(spaceRoutes, { projects: repos.projects, spaces: repos.spaces });
  app.register(pointCloudRoutes, {
    projects: repos.projects,
    clouds: repos.clouds,
  });
  app.register(issueRoutes, {
    projects: repos.projects,
    spaces: repos.spaces,
    issues: repos.issues,
  });

  return app;
}
