import "server-only";

import type { JobStatus } from "@/lib/domain/job-status";
import type { SessionUser } from "@/lib/types";

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Immutable states where job/asset data cannot be directly edited without a revision cycle. */
export const LOCKED_JOB_STATUSES: readonly JobStatus[] = ["APPROVED", "DELIVERED", "ARCHIVED", "CANCELLED"];

/**
 * Asserts that the user can edit job details, asset data, or calculations.
 * - Admin or the assigned Valuer can edit.
 * - Job must not be in a locked/approved status.
 */
export function assertCanEditJob(
  user: SessionUser,
  job: { id: string; valuerId: string; status: JobStatus },
): void {
  const isAdmin = user.roles.includes("ADMIN");
  const isAssignedValuer = user.id === job.valuerId && user.roles.includes("VALUER");

  if (!isAdmin && !isAssignedValuer) {
    throw new AuthorizationError("Only the assigned Valuer or an Administrator can modify this valuation job.");
  }

  if (LOCKED_JOB_STATUSES.includes(job.status)) {
    throw new AuthorizationError(
      `This valuation job is in '${job.status}' status and cannot be modified directly. Approved reports require creating a new revision.`,
    );
  }
}

/**
 * Asserts that the user can review or approve a report.
 * - User must have REVIEWER or ADMIN role.
 * - User must NOT be the valuer who prepared the report (self-approval prevention, PRD §3).
 */
export function assertCanReviewReport(
  user: SessionUser,
  job: { id: string; valuerId: string },
): void {
  const isReviewerOrAdmin = user.roles.includes("REVIEWER") || user.roles.includes("ADMIN");

  if (!isReviewerOrAdmin) {
    throw new AuthorizationError("Only users with the Reviewer or Administrator role can review or approve reports.");
  }

  // Self-approval restriction
  if (user.id === job.valuerId && !user.roles.includes("ADMIN")) {
    throw new AuthorizationError(
      "Valuation integrity rule: Valuers cannot approve their own valuation reports. Another qualified reviewer must review this report.",
    );
  }
}

/**
 * Asserts that the user can record delivery of an approved report.
 * - Requires CLERK or ADMIN role.
 */
export function assertCanDeliverReport(user: SessionUser): void {
  const canDeliver = user.roles.includes("CLERK") || user.roles.includes("ADMIN");
  if (!canDeliver) {
    throw new AuthorizationError("Only Report Clerks or Administrators are authorized to record report deliveries.");
  }
}

/**
 * Asserts that the user can manage company settings, numbering, and staff accounts.
 * - Strictly restricted to ADMIN role.
 */
export function assertCanManageSettings(user: SessionUser): void {
  if (!user.roles.includes("ADMIN")) {
    throw new AuthorizationError("Administrator permissions are required to access settings and user management.");
  }
}
