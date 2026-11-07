export type User =
  | { token: string; name: string; role: "staff" }
  | { token: string; name: string; role: "client"; account: string };

export interface UserRepository {
  findByToken(token: string): User | undefined;
}
