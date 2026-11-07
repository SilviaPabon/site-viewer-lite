import { buildApp } from './app.js';
import { PORT } from './modules/core/config.js';

const app = buildApp();

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
