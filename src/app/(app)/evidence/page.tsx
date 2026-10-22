import type { Metadata } from "next";

import { ModulePage } from "@/components/common/module-page";

export const metadata: Metadata = { title: "Evidence" };

export default function EvidencePage() {
  return (
    <ModulePage
      title="Evidence"
      description="Comparable and supporting market evidence linked to jobs."
      permission="evidence.view"
      plannedPhase="Phase 7 / B4 (Comparable evidence)"
    />
  );
}
