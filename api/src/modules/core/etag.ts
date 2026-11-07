import { createHash } from "node:crypto";
import type { onSendHookHandler } from "fastify";

export const etagOf = (payload: string) =>
  `"${createHash("sha256").update(payload).digest("base64url")}"`;

// RFC 9110 §13.1.2: If-None-Match is "*" or a comma-separated list, compared weakly (W/ ignored).
export function ifNoneMatchHits(
  header: string | undefined,
  etag: string,
): boolean {
  if (!header) return false;
  if (header.trim() === "*") return true;
  return header
    .split(",")
    .some((tag) => tag.trim().replace(/^W\//, "") === etag);
}

// Route-level onSend hook: hashes the payload actually sent (after the response schema filtered it),
// answers 304 when the client already has it, and keeps per-user responses out of shared caches.
export const conditionalGet: onSendHookHandler<unknown> = async (
  request,
  reply,
  payload,
) => {
  reply.header("Cache-Control", "private, no-cache");
  reply.header("Vary", "Authorization");
  if (reply.statusCode !== 200 || typeof payload !== "string") return payload;

  const etag = etagOf(payload);
  reply.header("ETag", etag);
  if (!ifNoneMatchHits(request.headers["if-none-match"], etag)) return payload;

  reply.code(304);
  return "";
};
