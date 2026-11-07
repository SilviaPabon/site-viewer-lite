import { describe, it, expect } from 'vitest';
import { authenticate } from './authenticate.js';
import type { User, UserRepository } from '../domain/user.js';

const dana: User = { token: 'staff-token', name: 'Dana', role: 'staff' };
const users: UserRepository = { findByToken: (t) => (t === dana.token ? dana : undefined) };

describe('authenticate (RFC 6750 bearer syntax)', () => {
  it.each(['Bearer staff-token', 'bearer staff-token', 'BEARER staff-token', 'Bearer   staff-token'])('accepts %j', (h) => {
    expect(authenticate(users, h)).toBe(dana);
  });

  it.each([
    undefined,
    '',
    'staff-token',
    'Basic staff-token',
    'Bearer',
    'Bearer ',
    'Bearer staff token',
    'Bearer staff-token ',
    'Bearer =staff-token',
    'Bearer staff-token\n',
    'Bearer ' + 'a'.repeat(2000),
  ])('rejects %j', (h) => {
    expect(authenticate(users, h)).toBeUndefined();
  });
});
