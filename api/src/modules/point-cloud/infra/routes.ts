import fastifyStatic from '@fastify/static';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { ProjectRepository } from '../../projects/index.js';
import type { CloudStore } from '../domain/cloud.js';
import { findCloud } from '../application/find-cloud.js';
import { ErrorBody, NOT_FOUND, ProjectIdParams } from '../../core/http.js';

const NO_CLOUD: ErrorBody = { error: 'Not Found', message: 'This project has no point cloud' };

export const pointCloudRoutes: FastifyPluginAsyncTypebox<{ projects: ProjectRepository; clouds: CloudStore }> = async (app, opts) => {
  // Only for reply.sendFile, which handles Range (206 / 416), Content-Length and streaming. No static folder is exposed.
  await app.register(fastifyStatic, { root: '/', serve: false });

  app.get('/api/projects/:id/cloud', {
    schema: { params: ProjectIdParams, response: { 404: ErrorBody } },
  }, async (request, reply) => {
    const cloud = await findCloud(opts.projects, opts.clouds, request.user, request.params.id);
    if (cloud.kind === 'project-not-found') return reply.code(404).send(NOT_FOUND);
    if (cloud.kind === 'no-cloud') return reply.code(404).send(NO_CLOUD);

    // Per-user access, so never in a shared cache (same reasoning as rule 6).
    reply.header('Cache-Control', 'private, no-cache').type('application/octet-stream');
    return reply.sendFile(cloud.file, cloud.dir, { cacheControl: false });
  });
};
