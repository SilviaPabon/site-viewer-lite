import type { User } from "../../auth/domain/user.js";
import type { Contact, Project } from "./project.js";
import type { ProjectDetail, ProjectSummary, PublicContact } from "./dto.js";

// Staff sees every project; a client only those of its own account.
export function canSee(user: User, project: Project): boolean {
  return user.role === "staff" || project.account === user.account;
}

// Allowlist DTOs (ADR-005, layer 2): every field is copied by name, never spread from a full object.
export function toProjectSummary(p: Project): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    status: p.status,
    clientName: p.client.name,
  };
}

function toPublicContact(c: Contact, user: User): PublicContact {
  // Rule 3: a client never gets email or phone, not even its own.
  return user.role === "staff"
    ? { role: c.role, name: c.name, email: c.email, phone: c.phone }
    : { role: c.role, name: c.name };
}

export function toProjectDetail(p: Project, user: User): ProjectDetail {
  return {
    ...toProjectSummary(p),
    dates: {
      signed: p.dates.signed,
      scan: p.dates.scan,
      estimatedDelivery: p.dates.estimatedDelivery,
      delivered: p.dates.delivered,
    },
    levels: [...p.levels],
    contacts: p.client.contacts.map((c) => toPublicContact(c, user)),
  };
}
