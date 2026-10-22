import "server-only";

import { compare, genSalt, hash } from "bcrypt-ts";

/** Hash a plaintext password with bcrypt (salt rounds = 10). */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await genSalt(10);
  return hash(plainText, salt);
}

/** Verify a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(plainText: string, passwordHash: string): Promise<boolean> {
  return compare(plainText, passwordHash);
}
