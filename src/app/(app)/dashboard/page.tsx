import type { Metadata } from "next";

import { ModulePage } from "@/components/common/module-page";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <ModulePage
      title="Dashboard"
      description="Overview of active valuation work."
      permission="dashboard.view"
      plannedPhase="Phase 2 (Dashboard)"
    />
  );
}
