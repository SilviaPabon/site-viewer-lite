import { describe, it, expect } from 'vitest';
import { DATA_DIR } from '../../core/config.js';
import { createUserJsonRepository } from './user-json-repository.js';

describe('UserJsonRepository', async () => {
  const repo = await createUserJsonRepository(DATA_DIR);

  it('finds staff and clients by token', () => {
    expect(repo.findByToken('staff-token')?.role).toBe('staff');
    expect(repo.findByToken('acme-token')).toMatchObject({ role: 'client', account: 'acme' });
  });

  it('returns undefined for an unknown token', () => {
    expect(repo.findByToken('nope')).toBeUndefined();
  });
});
