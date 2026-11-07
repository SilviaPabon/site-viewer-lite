import { readFile } from "node:fs/promises";
import path from "node:path";
import type { User, UserRepository } from "../domain/user.js";

type RawUser = { token: string; name: string; role: string; account?: string };

export async function createUserJsonRepository(
  dataDir: string,
): Promise<UserRepository> {
  const raw: RawUser[] = JSON.parse(
    await readFile(path.join(dataDir, "users.json"), "utf8"),
  );

  const users = new Map<string, User>();
  for (const u of raw) {
    // Unknown roles or clients without an account are ignored: they could never be authorised safely.
    if (u.role === "staff")
      users.set(u.token, { token: u.token, name: u.name, role: "staff" });
    else if (u.role === "client" && u.account)
      users.set(u.token, {
        token: u.token,
        name: u.name,
        role: "client",
        account: u.account,
      });
  }

  return { findByToken: (token) => users.get(token) };
}
