import { Construction } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/common/page-header";
import { AccessDenied, EmptyState } from "@/components/common/states";
import type { Permission } from "@/lib/domain/roles";
import { checkPermission } from "@/server/auth/session";

interface ModulePageProps {
  title: string;
  description: string;
  permission: Permission;
  /** Which planned phase delivers this module (shown in the empty state). */
  plannedPhase: string;
  children?: React.ReactNode;
}

/**
 * Standard protected module page. Checks the permission on the server, then
 * renders either the module content or an honest "not available yet" state.
 * No placeholder records are shown.
 */
export async function ModulePage({ title, description, permission, plannedPhase, children }: ModulePageProps) {
  const { allowed } = await checkPermission(permission);
  const breadcrumbs = [{ label: "Home", href: "/dashboard" }, { label: title }];

  return (
    <>
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      {!allowed ? (
        <AccessDenied />
      ) : (
        (children ?? (
          <EmptyState
            icon={Construction}
            title="Module not available yet"
            description={`This module will connect to live data in ${plannedPhase}. No records are shown until then.`}
          />
        ))
      )}
    </>
  );
}
