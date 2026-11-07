import { buildApp } from "./app.js";
import { DATA_DIR } from "./modules/core/config.js";
import { createUserJsonRepository } from "./modules/auth/infra/user-json-repository.js";
import { createProjectJsonRepository } from "./modules/projects/infra/project-json-repository.js";
import { createSpaceJsonRepository } from "./modules/spaces/infra/space-json-repository.js";
import { createCloudFileStore } from "./modules/point-cloud/infra/cloud-file-store.js";

// The real app over the starter kit data, for tests that go through HTTP.
export async function buildTestApp() {
  return buildApp({
    users: await createUserJsonRepository(DATA_DIR),
    projects: await createProjectJsonRepository(DATA_DIR),
    spaces: createSpaceJsonRepository(DATA_DIR),
    clouds: createCloudFileStore(DATA_DIR),
  });
}

export const auth = (token: string) => ({ authorization: `Bearer ${token}` });
