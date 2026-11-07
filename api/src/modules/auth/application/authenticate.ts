import type { User, UserRepository } from '../domain/user.js';

// RFC 6750 §2.1: credentials = "Bearer" 1*SP b64token; the scheme is case-insensitive (RFC 7235 §2.1).
// b64token = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" ) *"="
const BEARER = /^Bearer +([A-Za-z0-9\-._~+/]+=*)$/i;
const MAX_HEADER = 1024; // don't run the regex over arbitrarily large headers

// Returns the user behind an Authorization header, or undefined for a missing,
// malformed or unknown token. The caller cannot tell those cases apart, on purpose.
export function authenticate(users: UserRepository, header: string | undefined): User | undefined {
  if (!header || header.length > MAX_HEADER) return undefined;
  const token = BEARER.exec(header)?.[1];
  return token ? users.findByToken(token) : undefined;
}
