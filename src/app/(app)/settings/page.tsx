import type { Metadata } from "next";

import { ModulePage } from "@/components/common/module-page";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ModulePage
      title="Settings"
      description="Company profile, numbering, categories, units and report settings."
      permission="settings.manage"
      plannedPhase="Phase 11 / B9 (Settings)"
    />
  );
}
