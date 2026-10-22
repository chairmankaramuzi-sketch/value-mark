import { AlertTriangle, Inbox, Lock, type LucideIcon } from "lucide-react";
import * as React from "react";

import { Badge, Skeleton } from "@/components/ui/display";
import { JOB_STATUS_META, type JobStatus } from "@/lib/domain/job-status";
import { cn } from "@/lib/utils";

interface StateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

function StatePanel({ title, description, action, icon: Icon = Inbox, className, tone }: StateProps & { tone: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <div className={cn("rounded-full p-3", tone)}>
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      {action}
    </div>
  );
}

/** No records / feature not yet available. */
export function EmptyState(props: StateProps) {
  return <StatePanel {...props} tone="bg-muted text-muted-foreground" />;
}

/** A request failed. Always show the real failure, never a fake success. */
export function ErrorState({ icon = AlertTriangle, ...props }: StateProps) {
  return (
    <div role="alert">
      <StatePanel icon={icon} {...props} tone="bg-red-50 text-danger" />
    </div>
  );
}

export function AccessDenied({ description }: { description?: string }) {
  return (
    <StatePanel
      icon={Lock}
      title="Access denied"
      description={description ?? "Your role does not have permission to view this page. Contact an administrator if you believe this is a mistake."}
      tone="bg-amber-50 text-amber-800"
    />
  );
}

/** Generic skeleton for list/detail pages while data loads. */
export function LoadingState({ label = "Loading…", rows = 5 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const meta = JOB_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
