import type { JobStatus } from "@/lib/domain/job-status";

/**
 * Validated status transition rules (PRD §4).
 * Enforced strictly on the server to prevent invalid state progressions.
 */
export const ALLOWED_JOB_TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  NEW: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["INSPECTION_SCHEDULED", "VALUATION_IN_PROGRESS", "CANCELLED"],
  INSPECTION_SCHEDULED: ["INSPECTED", "CANCELLED"],
  INSPECTED: ["VALUATION_IN_PROGRESS", "CANCELLED"],
  VALUATION_IN_PROGRESS: ["DRAFT_REPORT", "CANCELLED"],
  DRAFT_REPORT: ["SUBMITTED_FOR_REVIEW", "VALUATION_IN_PROGRESS", "CANCELLED"],
  SUBMITTED_FOR_REVIEW: ["CHANGES_REQUESTED", "APPROVED", "CANCELLED"],
  CHANGES_REQUESTED: ["VALUATION_IN_PROGRESS", "DRAFT_REPORT", "CANCELLED"],
  APPROVED: ["DELIVERED", "ARCHIVED"],
  DELIVERED: ["ARCHIVED"],
  ARCHIVED: [],
  CANCELLED: [],
};

export function canTransitionJobStatus(current: JobStatus, target: JobStatus): boolean {
  if (current === target) return true;
  const allowed = ALLOWED_JOB_TRANSITIONS[current] ?? [];
  return allowed.includes(target);
}

export function assertValidJobTransition(current: JobStatus, target: JobStatus): void {
  if (!canTransitionJobStatus(current, target)) {
    throw new Error(
      `Invalid job status transition: cannot change status from '${current}' to '${target}'.`,
    );
  }
}
