import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { ProjectDetail } from './dto.js';

// ADR-005, layer 3 on its own: even if a handler returns a leaky object, the response schema drops it.
describe('response schema as the last lock', () => {
  it('drops fields the schema does not declare, at any depth', async () => {
    const app = Fastify();
    app.get('/leak', { schema: { response: { 200: ProjectDetail } } }, async () => ({
      id: '1', name: 'n', address: 'a', status: 's', clientName: 'c',
      dates: { signed: null, scan: null, estimatedDelivery: null, delivered: null, invoiceDate: '2026-01-01' },
      levels: [],
      contacts: [{ role: 'r', name: 'x', ssn: '123' }],
      internal: { price: 1, notes: 'secret' },
    }));

    const body = (await app.inject({ url: '/leak' })).body;
    expect(body).not.toMatch(/internal|price|secret|invoiceDate|ssn/);
    expect(JSON.parse(body).name).toBe('n');
  });
});
