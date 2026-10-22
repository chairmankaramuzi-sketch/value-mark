/**
 * Application roles and UI-level permissions.
 *
 * IMPORTANT: these helpers only drive what the interface *shows*.
 * Server-side authorization (Phase B2) is authoritative and must re-check
 * every protected read/mutation independently.
 */

export const ROLES = ["ADMIN", "VALUER", "REVIEWER", "CLERK", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  VALUER: "Valuer",
  REVIEWER: "Reviewer / Approver",
  CLERK: "Report Clerk / Operations",
  VIEWER: "Read-only / Management",
};

export const PERMISSIONS = [
  "dashboard.view",
  "jobs.view",
  "clients.view",
  "inspections.view",
  "evidence.view",
  "reports.view",
  "users.manage",
  "settings.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL_STAFF_VIEW: Permission[] = [
  "dashboard.view",
  "jobs.view",
  "clients.view",
  "inspections.view",
  "evidence.view",
  "reports.view",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [...ALL_STAFF_VIEW, "users.manage", "settings.manage"],
  VALUER: ALL_STAFF_VIEW,
  REVIEWER: ALL_STAFF_VIEW,
  CLERK: ALL_STAFF_VIEW,
  VIEWER: ALL_STAFF_VIEW,
};

/** A user may hold several roles (e.g. Clerk + Valuer). */
export function hasPermission(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
