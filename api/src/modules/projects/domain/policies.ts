import type { User } from '../../auth/domain/user.js';
import type { Contact, Project } from './project.js';

// Staff sees every project; a client only those of its own account.
export function canSee(user: User, project: Project): boolean {
  return user.role === 'staff' || project.account === user.account;
}

export type ProjectSummary = {
  id: string;
  name: string;
  address: string;
  status: string;
  clientName: string;
};

export type PublicContact = { role: string; name: string; email?: string | null; phone?: string | null };

export type ProjectDetail = ProjectSummary & {
  dates: Project['dates'];
  levels: string[];
  contacts: PublicContact[];
};

// Allowlist DTOs (ADR-005, layer 2): every field is copied by name, never spread.
export function toProjectSummary(p: Project): ProjectSummary {
  return { id: p.id, name: p.name, address: p.address, status: p.status, clientName: p.client.name };
}

function toPublicContact(c: Contact, user: User): PublicContact {
  // Rule 3: a client never gets email or phone, not even its own.
  return user.role === 'staff' ? { role: c.role, name: c.name, email: c.email, phone: c.phone } : { role: c.role, name: c.name };
}

export function toProjectDetail(p: Project, user: User): ProjectDetail {
  return {
    ...toProjectSummary(p),
    dates: { signed: p.dates.signed, scan: p.dates.scan, estimatedDelivery: p.dates.estimatedDelivery, delivered: p.dates.delivered },
    levels: [...p.levels],
    contacts: p.client.contacts.map((c) => toPublicContact(c, user)),
  };
}
