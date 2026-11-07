import { Type, type Static } from 'typebox';

// Shared HTTP pieces: one error body shape and the project id rule every /projects/:id route uses.
export const ErrorBody = Type.Object({ error: Type.String(), message: Type.String() });
export type ErrorBody = Static<typeof ErrorBody>;

// Ids in the kit look like 1201-30001. Anything else is rejected with 400 before any lookup.
export const ProjectIdParams = Type.Object({ id: Type.String({ pattern: '^[0-9]{4}-[0-9]{5}$' }) });

export const NOT_FOUND: ErrorBody = { error: 'Not Found', message: 'Project not found' };
