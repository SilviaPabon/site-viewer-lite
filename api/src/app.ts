import Fastify from 'fastify';

// Builds the app without listening, so tests can drive it with app.inject().
export function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  app.get('/api/health', async () => ({ ok: true }));

  return app;
}
