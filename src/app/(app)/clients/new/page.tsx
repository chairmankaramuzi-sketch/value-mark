import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/display";
import { requireUser } from "@/server/auth/session";

import { ClientForm } from "./client-form";

export const metadata: Metadata = { title: "Register Client" };

export default async function NewClientPage() {
  await requireUser();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Register Client"
        description="Register a new individual or institutional client requesting valuation services."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Clients", href: "/clients" },
          { label: "New Client" },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
