// What the rest of the app knows about a project. There is deliberately no `internal` field:
// the repository never hands it over (ADR-005, layer 1).
export type Contact = { role: string; name: string; email: string | null; phone: string | null };

export type Project = {
  id: string;
  name: string;
  address: string;
  account: string;
  status: string;
  client: { name: string; contacts: Contact[] };
  dates: { signed: string | null; scan: string | null; estimatedDelivery: string | null; delivered: string | null };
  levels: string[];
  cloud: string | null;
};

export interface ProjectRepository {
  findAll(): Project[];
  findById(id: string): Project | undefined;
}
