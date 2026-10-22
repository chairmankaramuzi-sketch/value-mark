import type { Metadata } from "next";

import { ModulePage } from "@/components/common/module-page";

export const metadata: Metadata = { title: "Valuation Jobs" };

export default function ValuationJobsPage() {
  return (
    <ModulePage
      title="Valuation Jobs"
      description="Create, assign and track valuation assignments."
      permission="jobs.view"
      plannedPhase="Phase 4 / B3 (Job management)"
    />
  );
}
