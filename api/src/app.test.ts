import { describe, it, expect } from 'vitest';
import { buildApp } from './app.js';

describe('app', () => {
  it('answers health without opening a port', async () => {
    const res = await buildApp().inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});
