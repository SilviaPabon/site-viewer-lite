import { Type, type Static } from "typebox";

// What a project looks like on the wire. Each schema is written once and gives two things:
// the TypeScript type (compile time) and the JSON Schema Fastify serializes with (runtime).
// The serializer writes ONLY these properties, so a field that slips into a DTO is still dropped (ADR-005, layer 3).
const NullableString = Type.Union([Type.String(), Type.Null()]);

export const ProjectSummary = Type.Object({
  id: Type.String(),
  name: Type.String(),
  address: Type.String(),
  status: Type.String(),
  clientName: Type.String(),
});
export type ProjectSummary = Static<typeof ProjectSummary>;

export const PublicContact = Type.Object({
  role: Type.String(),
  name: Type.String(),
  // Only present for staff (rule 3).
  email: Type.Optional(NullableString),
  phone: Type.Optional(NullableString),
});
export type PublicContact = Static<typeof PublicContact>;

export const ProjectDetail = Type.Object({
  ...ProjectSummary.properties,
  dates: Type.Object({
    signed: NullableString,
    scan: NullableString,
    estimatedDelivery: NullableString,
    delivered: NullableString,
  }),
  levels: Type.Array(Type.String()),
  contacts: Type.Array(PublicContact),
});
export type ProjectDetail = Static<typeof ProjectDetail>;
