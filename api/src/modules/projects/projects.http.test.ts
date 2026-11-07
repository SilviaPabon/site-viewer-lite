import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, auth } from '../../test-utils.js';

const TOKENS = ['staff-token', 'acme-token', 'brick-token'];
const URLS = ['/api/projects', ...['1201-30001', '1201-30002', '0980-41007'].flatMap((id) => [`/api/projects/${id}`, `/api/projects/${id}/spaces`])];

describe('projects and spaces over HTTP', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildTestApp(); });
  const get = (url: string, token: string) => app.inject({ method: 'GET', url, headers: auth(token) });

  it('lists only the projects the user can see', async () => {
    expect((await get('/api/projects', 'brick-token')).json().map((p: { id: string }) => p.id)).toEqual(['0980-41007']);
  });

  it('returns the detail and the spaces of a visible project', async () => {
    const detail = await get('/api/projects/1201-30001', 'acme-token');
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({ name: '410 Harbor Ave', clientName: 'Acme Builders', levels: ['Level 1', 'Level 2'] });

    const spaces = await get('/api/projects/1201-30001/spaces', 'acme-token');
    expect(spaces.statusCode).toBe(200);
    expect(spaces.json()[0]).toEqual({ id: 's1', name: 'Lobby', level: 'Level 1', use: 'Circulation', x: 0, y: 0, z: 0, w: 8, d: 6, h: 3.2 });
  });

  // Rule 2: scan every response of every user as raw text.
  it('rule 2: no internal data in any response, for anyone', async () => {
    for (const token of TOKENS) {
      for (const url of URLS) {
        expect((await get(url, token)).body).not.toMatch(/internal|price|invoice|margin|notes|INV-/);
      }
    }
  });

  it('rule 3: contact email and phone only for staff', async () => {
    expect((await get('/api/projects/1201-30001', 'staff-token')).body).toMatch(/sam@acme\.example/);
    for (const token of ['acme-token', 'brick-token']) {
      for (const url of URLS) {
        expect((await get(url, token)).body).not.toMatch(/@|555/);
      }
    }
  });

  // Rule 4: same status, same body, same headers as a project that doesn't exist.
  it.each(['/api/projects/:id', '/api/projects/:id/spaces'])('rule 4: %s of another client is identical to a missing one', async (path) => {
    const foreign = await get(path.replace(':id', '1201-30001'), 'brick-token');
    const missing = await get(path.replace(':id', '9999-99999'), 'brick-token');
    expect(foreign.statusCode).toBe(404);
    expect(foreign.body).toBe(missing.body);
    const { date: _a, ...h1 } = foreign.headers;
    const { date: _b, ...h2 } = missing.headers;
    expect(h1).toEqual(h2);
  });

  // Rule 5 (ids): malformed ids are a 4xx, never a 500.
  it.each(['abc', '1201-3000', '1201-300011', '..%2F..%2Fusers', '%00', "1'OR'1", '1201_30001'])('rule 5: id %j → 400', async (id) => {
    for (const suffix of ['', '/spaces']) {
      const res = await get(`/api/projects/${id}${suffix}`, 'staff-token');
      expect(res.statusCode).toBe(400);
    }
  });
});
