// The wire types come from the API's TypeBox schemas (ADR-013): one definition for server and viewer.
// `import type` is erased at build time, so no server code reaches the browser bundle.
export type {
  ProjectSummary,
  ProjectDetail,
  PublicContact,
} from "../../../../api/src/modules/projects/domain/dto";
export type { Space } from "../../../../api/src/modules/spaces/domain/space";
