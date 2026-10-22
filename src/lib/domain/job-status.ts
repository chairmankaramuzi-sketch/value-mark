/**
 * Valuation job statuses (PRD §4).
 * Allowed transitions are a server-side business rule and will be defined
 * and enforced in Phase B3 — not here.
 */

export const JOB_STATUSES = [
  "NEW",
  "ASSIGNED",
  "INSPECTION_SCHEDULED",
  "INSPECTED",
  "VALUATION_IN_PROGRESS",
  "DRAFT_REPORT",
  "SUBMITTED_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "DELIVERED",
  "ARCHIVED",
  "CANCELLED",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger" | "muted";

export const JOB_STATUS_META: Record<JobStatus, { label: string; tone: StatusTone }> = {
  NEW: { label: "New", tone: "neutral" },
  ASSIGNED: { label: "Assigned", tone: "info" },
  INSPECTION_SCHEDULED: { label: "Inspection scheduled", tone: "info" },
  INSPECTED: { label: "Inspected", tone: "info" },
  VALUATION_IN_PROGRESS: { label: "Valuation in progress", tone: "warning" },
  DRAFT_REPORT: { label: "Draft report", tone: "warning" },
  SUBMITTED_FOR_REVIEW: { label: "Submitted for review", tone: "warning" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "danger" },
  APPROVED: { label: "Approved", tone: "success" },
  DELIVERED: { label: "Delivered", tone: "success" },
  ARCHIVED: { label: "Archived", tone: "muted" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};
