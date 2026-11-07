import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Contact, Project, ProjectRepository } from '../domain/project.js';

// Shape of projects.json as it sits on disk, `internal` included. Only this file sees it.
type RawProject = Project & { internal?: unknown };

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

// Projection: copy field by field what the app may use. Like a SELECT of named columns,
// anything not listed here (internal, or any future field) stays on disk.
function toProject(r: RawProject): Project {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    account: r.account,
    status: r.status,
    client: {
      name: r.client.name,
      contacts: r.client.contacts.map((c): Contact => ({ role: c.role, name: c.name, email: str(c.email), phone: str(c.phone) })),
    },
    dates: {
      signed: str(r.dates.signed),
      scan: str(r.dates.scan),
      estimatedDelivery: str(r.dates.estimatedDelivery),
      delivered: str(r.dates.delivered),
    },
    levels: [...r.levels],
    cloud: str(r.cloud),
  };
}

export async function createProjectJsonRepository(dataDir: string): Promise<ProjectRepository> {
  const raw: RawProject[] = JSON.parse(await readFile(path.join(dataDir, 'projects.json'), 'utf8'));
  const projects = raw.map(toProject);
  const byId = new Map(projects.map((p) => [p.id, p]));

  return {
    findAll: () => projects,
    findById: (id) => byId.get(id),
  };
}
