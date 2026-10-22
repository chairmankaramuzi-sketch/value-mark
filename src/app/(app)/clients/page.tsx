import type { Metadata } from "next";

import { ModulePage } from "@/components/common/module-page";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <ModulePage
      title="Clients"
      description="Individual and organisation clients."
      permission="clients.view"
      plannedPhase="Phase 3 / B3 (Client management)"
    />
  );
}
