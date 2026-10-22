import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { serverEnv } from "@/config/env";
import { hasPermission, isRole, ROLE_LABELS, type Permission, type Role } from "@/lib/domain/roles";
import type { SessionUser } from "@/lib/types";
import { verifySessionToken } from "@/server/auth/jwt";

export const SESSION_COOKIE_NAME = "vm_session";
export const DEMO_ROLE_COOKIE = "vm_demo_role";

/**
 * Resolve the current authenticated user on the server.
 * Prioritizes the real verified JWT session cookie, with development demo session fallback.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();

  // 1. Check real authenticated session token
  const sessionToken = store.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    const verified = await verifySessionToken(sessionToken);
    if (verified) {
      return {
        id: verified.userId,
        name: verified.name,
        email: verified.email,
        roles: verified.roles,
        isDemo: false,
      };
    }
  }

  // 2. Optional development-only demo session
  if (serverEnv.demoAuthEnabled) {
    const role = store.get(DEMO_ROLE_COOKIE)?.value;
    if (isRole(role)) {
      return {
        id: `demo-${role.toLowerCase()}`,
        name: `Demo ${ROLE_LABELS[role]}`,
        email: "demo@valuemark.example",
        roles: [role],
        isDemo: true,
      };
    }
  }

  return null;
}

/** Redirects to sign-in when there is no authenticated session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Returns the user and whether they hold the requested permission. */
export async function checkPermission(
  permission: Permission,
): Promise<{ user: SessionUser; allowed: boolean }> {
  const user = await requireUser();
  return { user, allowed: hasPermission(user.roles, permission) };
}

/**
 * Server-side guard: throws an Unauthorized exception if user lacks one of the required roles.
 */
export async function requireRoles(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  const hasRequiredRole = user.roles.some((r) => allowedRoles.includes(r));
  if (!hasRequiredRole) {
    throw new Error(`Unauthorized: User lacks required role. (Requires: ${allowedRoles.join(", ")})`);
  }
  return user;
}
