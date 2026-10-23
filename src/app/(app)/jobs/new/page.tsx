import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/display";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

import { JobForm } from "./job-form";

export const metadata: Metadata = { title: "New Valuation Job" };

interface NewJobPageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const currentUser = await requireUser();
  const params = await searchParams;

  let clients: { id: string; name: string; reference: string }[] = [];
  let valuers: { id: string; name: string }[] = [];
  let reviewers: { id: string; name: string }[] = [];

  try {
    [clients, valuers, reviewers] = await Promise.all([
      prisma.client.findMany({
        where: { isArchived: false },
        select: { id: true, name: true, reference: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { isActive: true, roles: { hasSome: ["VALUER", "ADMIN"] } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { isActive: true, roles: { hasSome: ["REVIEWER", "ADMIN"] } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {
    // Database connection issue: fallback to currentUser if empty
    valuers = [{ id: currentUser.id, name: currentUser.name }];
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Create Valuation Job"
        description="Initiate a new valuation assignment, assign staff, and record instruction parameters."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Valuation Jobs", href: "/jobs" },
          { label: "New Job" },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <JobForm
            clients={clients}
            valuers={valuers}
            reviewers={reviewers}
            defaultClientId={params.clientId}
            defaultValuerId={currentUser.roles.includes("VALUER") ? currentUser.id : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
