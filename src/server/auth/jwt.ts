import "server-only";

import { jwtVerify, SignJWT } from "jose";

import type { Role } from "@/lib/domain/roles";

const DEFAULT_JWT_SECRET = "valuemark-internal-secret-at-least-32-chars-long";
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || DEFAULT_JWT_SECRET);
const JWT_ALGORITHM = "HS256";
const ISSUER = "valuemark:auth";

export interface SessionTokenPayload {
  userId: string;
  email: string;
  name: string;
  roles: Role[];
}

/** Signs a stateless JWT session token valid for 7 days. */
export async function createSessionToken(payload: SessionTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/** Verifies and decodes a session token. Returns null if invalid or expired. */
export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: ISSUER,
      algorithms: [JWT_ALGORITHM],
    });

    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      Array.isArray(payload.roles)
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        roles: payload.roles as Role[],
      };
    }
    return null;
  } catch {
    return null;
  }
}
