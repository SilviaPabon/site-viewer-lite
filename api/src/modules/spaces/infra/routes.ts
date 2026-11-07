import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { ProjectRepository } from '../../projects/index.js';
import { Space, type SpaceRepository } from '../domain/space.js';
import { getSpaces } from '../application/get-spaces.js';
import { ErrorBody, NOT_FOUND, ProjectIdParams } from '../../core/http.js';

export const spaceRoutes: FastifyPluginAsyncTypebox<{ projects: ProjectRepository; spaces: SpaceRepository }> = async (app, opts) => {
  app.get('/api/projects/:id/spaces', {
    schema: { params: ProjectIdParams, response: { 200: Type.Array(Space), 404: ErrorBody } },
  }, async (request, reply) => {
    const result = await getSpaces(opts.projects, opts.spaces, request.user, request.params.id);
    return result ?? reply.code(404).send(NOT_FOUND);
  });
};
