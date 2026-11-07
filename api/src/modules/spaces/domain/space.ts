import { Type, type Static } from "typebox";

// A room as a box: x, y, z = min corner in metres (Z up); w, d, h = size.
// One schema: the type for the code and the response schema for Fastify.
export const Space = Type.Object({
  id: Type.String(),
  name: Type.String(),
  level: Type.String(),
  use: Type.String(),
  x: Type.Number(),
  y: Type.Number(),
  z: Type.Number(),
  w: Type.Number(),
  d: Type.Number(),
  h: Type.Number(),
});
export type Space = Static<typeof Space>;

export interface SpaceRepository {
  findByProjectId(projectId: string): Promise<Space[]>;
}
