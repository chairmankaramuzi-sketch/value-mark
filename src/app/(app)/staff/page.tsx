import type { Metadata } from "next";

import { ModulePage } from "@/components/common/module-page";

export const metadata: Metadata = { title: "Staff & Users" };

export default function StaffUsersPage() {
  return (
    <ModulePage
      title="Staff & Users"
      description="Manage staff accounts and role assignments."
      permission="users.manage"
      plannedPhase="Phase 11 / B2 (Staff and users)"
    />
  );
}
