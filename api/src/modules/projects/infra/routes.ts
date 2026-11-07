import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { ProjectRepository } from '../domain/project.js';
import { ProjectDetail, ProjectSummary } from '../domain/dto.js';
import { getProject, listProjects } from '../application/project-queries.js';
import { ErrorBody, NOT_FOUND, ProjectIdParams } from '../../core/http.js';

// The TypeBox plugin type infers request.params and the reply types from the schemas below.
export const projectRoutes: FastifyPluginAsyncTypebox<{ projects: ProjectRepository }> = async (app, { projects }) => {
  app.get('/api/projects', {
    schema: { response: { 200: Type.Array(ProjectSummary) } },
  }, async (request) => listProjects(projects, request.user));

  app.get('/api/projects/:id', {
    schema: { params: ProjectIdParams, response: { 200: ProjectDetail, 404: ErrorBody } },
  }, async (request, reply) => {
    const detail = getProject(projects, request.user, request.params.id);
    return detail ?? reply.code(404).send(NOT_FOUND);
  });
};
