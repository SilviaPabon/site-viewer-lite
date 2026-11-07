import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { ProjectRepository } from "../../projects/index.js";
import type { SpaceRepository } from "../../spaces/index.js";
import { ErrorBody, NOT_FOUND, ProjectIdParams } from "../../core/http.js";
import {
  CreatedIssue,
  NewIssueBody,
  type IssueRepository,
} from "../domain/issue.js";
import { createIssue } from "../application/create-issue.js";

export const issueRoutes: FastifyPluginAsyncTypebox<{
  projects: ProjectRepository;
  spaces: SpaceRepository;
  issues: IssueRepository;
}> = async (app, deps) => {
  app.post(
    "/api/projects/:id/issues",
    {
      bodyLimit: 4 * 1024, // a report is a few hundred bytes; anything bigger is a 413
      schema: {
        params: ProjectIdParams,
        body: NewIssueBody,
        response: { 201: CreatedIssue, 400: ErrorBody, 404: ErrorBody },
      },
    },
    async (request, reply) => {
      const result = await createIssue(
        deps,
        request.user,
        request.params.id,
        request.body,
      );
      if (result.kind === "project-not-found")
        return reply.code(404).send(NOT_FOUND);
      if (result.kind === "invalid")
        return reply
          .code(400)
          .send({ error: "Bad Request", message: result.message });
      return reply.code(201).send({ id: result.id });
    },
  );
};
