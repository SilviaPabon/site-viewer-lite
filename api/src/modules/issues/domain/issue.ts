import { Type, type Static } from "typebox";

// What the client may send. Shape rules live here; rules that need the project live in validateIssue.
export const NewIssueBody = Type.Object(
  {
    title: Type.String({ minLength: 1, maxLength: 120 }),
    level: Type.String({ minLength: 1, maxLength: 120 }),
    spaceId: Type.Optional(Type.String({ minLength: 1, maxLength: 64 })),
  },
  { additionalProperties: false },
);
export type NewIssueBody = Static<typeof NewIssueBody>;

export const CreatedIssue = Type.Object({ id: Type.String() });

export type Issue = {
  id: string;
  projectId: string;
  title: string;
  level: string;
  spaceId?: string;
  createdBy: string;
  createdAt: string;
};

export interface IssueRepository {
  save(issue: Issue): Promise<void>;
}

// Rules beyond the schema: title not blank once trimmed, level exists, space belongs to that level.
export function validateIssue(
  body: NewIssueBody,
  levels: string[],
  spaces: { id: string; level: string }[],
): { ok: true; title: string } | { ok: false; message: string } {
  // The schema already caps the length; trimming can only make a title blank.
  const title = body.title.trim();
  if (!title) return { ok: false, message: "Title is required" };
  if (!levels.includes(body.level))
    return { ok: false, message: "Level does not exist in this project" };
  if (body.spaceId !== undefined) {
    const space = spaces.find((s) => s.id === body.spaceId);
    if (!space)
      return { ok: false, message: "Space does not exist in this project" };
    if (space.level !== body.level)
      return { ok: false, message: "Space is not on that level" };
  }
  return { ok: true, title };
}
