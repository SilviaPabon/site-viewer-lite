import { buildApp } from './app.js';
import { DATA_DIR, PORT } from './modules/core/config.js';
import { createUserJsonRepository } from './modules/auth/infra/user-json-repository.js';
import { createProjectJsonRepository } from './modules/projects/infra/project-json-repository.js';
import { createSpaceJsonRepository } from './modules/spaces/infra/space-json-repository.js';

const app = buildApp({
  users: await createUserJsonRepository(DATA_DIR),
  projects: await createProjectJsonRepository(DATA_DIR),
  spaces: createSpaceJsonRepository(DATA_DIR),
});

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
