import type { Metadata } from "next";

import { ModulePage } from "@/components/common/module-page";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reports"
      description="Draft and approved report versions."
      permission="reports.view"
      plannedPhase="Phase 9 / B6 (Report generation)"
    />
  );
}
