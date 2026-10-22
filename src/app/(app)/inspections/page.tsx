import type { Metadata } from "next";

import { ModulePage } from "@/components/common/module-page";

export const metadata: Metadata = { title: "Inspections" };

export default function InspectionsPage() {
  return (
    <ModulePage
      title="Inspections"
      description="Scheduled and completed site inspections."
      permission="inspections.view"
      plannedPhase="Phase 6 / B4 (Inspections and files)"
    />
  );
}
