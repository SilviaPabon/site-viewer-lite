import { describe, it, expect } from 'vitest';
import type { User } from '../../auth/domain/user.js';
import { DATA_DIR } from '../../core/config.js';
import { createProjectJsonRepository } from '../infra/project-json-repository.js';
import { getProject, listProjects } from './project-queries.js';

const staff: User = { token: 's', name: 'Dana', role: 'staff' };
const acme: User = { token: 'a', name: 'Sam', role: 'client', account: 'acme' };
const brick: User = { token: 'b', name: 'Rita', role: 'client', account: 'brick' };

describe('project queries', async () => {
  const repo = await createProjectJsonRepository(DATA_DIR);

  it('staff lists every project, clients only their own', () => {
    expect(listProjects(repo, staff).map((p) => p.id)).toEqual(['1201-30001', '1201-30002', '0980-41007']);
    expect(listProjects(repo, acme).map((p) => p.id)).toEqual(['1201-30001', '1201-30002']);
    expect(listProjects(repo, brick).map((p) => p.id)).toEqual(['0980-41007']);
  });

  it('list items carry only the summary fields', () => {
    expect(listProjects(repo, acme)[0]).toEqual({
      id: '1201-30001',
      name: '410 Harbor Ave',
      address: '410 Harbor Ave, Oakland, CA',
      status: 'In production',
      clientName: 'Acme Builders',
    });
  });

  it('rule 4: another client’s project looks exactly like a missing one', () => {
    expect(getProject(repo, brick, '1201-30001')).toBeUndefined();
    expect(getProject(repo, brick, '9999-99999')).toBeUndefined();
  });

  it('rule 3: staff sees contact email and phone, a client does not', () => {
    expect(getProject(repo, staff, '1201-30001')?.contacts[0]).toEqual({
      role: 'primary', name: 'Sam Lee', email: 'sam@acme.example', phone: '+1 510 555 0101',
    });
    expect(getProject(repo, acme, '1201-30001')?.contacts[0]).toEqual({ role: 'primary', name: 'Sam Lee' });
  });

  it('detail keeps null dates (the viewer shows "Not recorded")', () => {
    expect(getProject(repo, brick, '0980-41007')?.dates).toEqual({
      signed: '2026-10-20', scan: null, estimatedDelivery: null, delivered: null,
    });
  });

  it('rule 2: nothing internal in any list or detail, for any user', () => {
    for (const user of [staff, acme, brick]) {
      const out = JSON.stringify([listProjects(repo, user), ...repo.findAll().map((p) => getProject(repo, user, p.id))]);
      expect(out).not.toMatch(/internal|price|invoice|margin|notes|account/);
    }
  });
});
