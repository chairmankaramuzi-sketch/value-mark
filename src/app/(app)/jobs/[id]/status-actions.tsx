"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ALLOWED_JOB_TRANSITIONS } from "@/lib/domain/job-status-machine";
import { JOB_STATUS_META, type JobStatus } from "@/lib/domain/job-status";
import { transitionStatusAction } from "@/server/actions/job-actions";

interface StatusActionsProps {
  jobId: string;
  currentStatus: JobStatus;
}

export function StatusActions({ jobId, currentStatus }: StatusActionsProps) {
  const [pending, startTransition] = useTransition();
  const allowedNext = ALLOWED_JOB_TRANSITIONS[currentStatus] || [];

  if (allowedNext.length === 0) {
    return null;
  }

  function handleTransition(targetStatus: JobStatus) {
    startTransition(async () => {
      try {
        await transitionStatusAction(jobId, targetStatus);
        toast.success(`Job status changed to ${JOB_STATUS_META[targetStatus].label}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to change job status.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Advance to:</span>
      {allowedNext.map((target) => {
        const meta = JOB_STATUS_META[target];
        const isCritical = target === "APPROVED" || target === "CANCELLED" || target === "DELIVERED";

        if (isCritical) {
          return (
            <ConfirmDialog
              key={target}
              title={`Confirm: Move to ${meta.label}?`}
              description={
                target === "APPROVED"
                  ? "Approved reports become immutable. A formal revision cycle will be required for any further changes."
                  : target === "CANCELLED"
                  ? "This will cancel the assignment."
                  : "Record that the report has been delivered to the instructing client."
              }
              confirmLabel={`Confirm ${meta.label}`}
              confirmVariant={target === "CANCELLED" ? "danger" : "primary"}
              onConfirm={async () => {
                await transitionStatusAction(jobId, target);
                toast.success(`Job status changed to ${meta.label}`);
              }}
              trigger={
                <Button
                  size="sm"
                  variant={target === "APPROVED" ? "primary" : target === "CANCELLED" ? "danger" : "secondary"}
                  disabled={pending}
                >
                  {target === "APPROVED" && <CheckCircle2 className="size-3.5" />}
                  {meta.label}
                </Button>
              }
            />
          );
        }

        return (
          <Button
            key={target}
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => handleTransition(target)}
          >
            <ArrowRight className="size-3.5" />
            {meta.label}
          </Button>
        );
      })}
    </div>
  );
}
