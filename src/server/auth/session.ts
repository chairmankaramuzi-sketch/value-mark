import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { serverEnv } from "@/config/env";
import { hasPermission, isRole, ROLE_LABELS, type Permission } from "@/lib/domain/roles";
import type { SessionUser } from "@/lib/types";

export const DEMO_ROLE_COOKIE = "vm_demo_role";

/**
 * Resolve the current user on the server.
 *
 * Phase 1: real authentication is not implemented yet (Phase B2), so this
 * returns `null` unless the clearly-labelled development demo session is
 * enabled. Replace the body with the real auth provider lookup in B2.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // Always read the request so protected routes are rendered per request,
  // never statically prerendered.
  const store = await cookies();
  if (!serverEnv.demoAuthEnabled) return null;

  const role = store.get(DEMO_ROLE_COOKIE)?.value;
  if (!isRole(role)) return null;

  return {
    id: `demo-${role.toLowerCase()}`,
    name: `Demo ${ROLE_LABELS[role]}`,
    email: "demo@example.invalid",
    roles: [role],
    isDemo: true,
  };
}

/** Redirects to sign-in when there is no session. Use in protected layouts/pages. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Returns the user and whether they hold the given permission. */
export async function checkPermission(
  permission: Permission,
): Promise<{ user: SessionUser; allowed: boolean }> {
  const user = await requireUser();
  return { user, allowed: hasPermission(user.roles, permission) };
}
