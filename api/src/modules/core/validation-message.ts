import type { FastifySchemaValidationError } from "fastify";

// Turns Ajv's first error into a sentence a person can read in the form,
// e.g. "body/title must NOT have fewer than 1 characters" → "Title is required".
export function validationMessage(
  errors: FastifySchemaValidationError[],
): string {
  const e = errors[0];
  if (!e) return "Invalid request";

  const params = e.params as Record<string, unknown>;
  // "/title" → "Title"; a missing property names itself in params.
  const raw =
    e.keyword === "required"
      ? String(params.missingProperty)
      : e.instancePath.split("/").filter(Boolean).pop();
  const field = raw
    ? raw.charAt(0).toUpperCase() + raw.slice(1)
    : "Request body";

  switch (e.keyword) {
    case "required":
      return `${field} is required`;
    case "type":
      return raw
        ? `${field} must be text`
        : "Request body must be a JSON object";
    case "minLength":
      return Number(params.limit) === 1
        ? `${field} is required`
        : `${field} must be at least ${params.limit} characters`;
    case "maxLength":
      return `${field} must be at most ${params.limit} characters`;
    default:
      return `${field} is not valid`;
  }
}
