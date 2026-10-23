import Link from "next/link";
import { Briefcase, Plus, Search } from "lucide-react";
import type { AssetCategory, JobStatus } from "@prisma/client";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState, JobStatusBadge } from "@/components/common/states";
import { Badge } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JOB_STATUSES, JOB_STATUS_META } from "@/lib/domain/job-status";
import { requireUser } from "@/server/auth/session";
import { listJobs } from "@/server/services/job-service";

interface JobsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  await requireUser();
  const params = await searchParams;
  const search = params.search || "";
  const status = (params.status as JobStatus) || undefined;
  const assetCategory = (params.category as AssetCategory) || undefined;
  const page = Number(params.page) || 1;

  let jobsData = { jobs: [] as any[], total: 0, page: 1, limit: 15, totalPages: 1 };
  let errorMsg = null;

  try {
    jobsData = await listJobs({ search, status, assetCategory, page, limit: 15 });
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : "Database connection issue.";
  }

  const { jobs, total, totalPages } = jobsData;

  return (
    <div>
      <PageHeader
        title="Valuation Jobs"
        description="Manage valuation assignments from client request through to final report delivery."
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Valuation Jobs" }]}
        actions={
          <Button asChild>
            <Link href="/jobs/new">
              <Plus className="size-4" aria-hidden="true" />
              New Valuation Job
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form method="GET" className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search reference, location, client, or borrower…"
              className="pl-9"
            />
          </div>

          <Select name="status" defaultValue={status || ""} className="w-auto min-w-[160px]">
            <option value="">All Statuses</option>
            {JOB_STATUSES.map((st) => (
              <option key={st} value={st}>
                {JOB_STATUS_META[st].label}
              </option>
            ))}
          </Select>

          <Select name="category" defaultValue={assetCategory || ""} className="w-auto min-w-[140px]">
            <option value="">All Categories</option>
            <option value="LAND">Land</option>
            <option value="BUILDING">Building</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="MACHINERY">Machinery</option>
            <option value="OTHER">Other</option>
          </Select>

          <Button type="submit" variant="secondary" size="md">
            Filter
          </Button>
        </form>

        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {total} job{total === 1 ? "" : "s"} total
        </p>
      </div>

      {errorMsg ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Notice: Database not connected</p>
          <p className="mt-1 text-xs">
            {errorMsg.includes("Can't reach database")
              ? "Your DATABASE_URL is not yet connected to a live PostgreSQL server. Connect your database to store real records."
              : errorMsg}
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No valuation jobs found"
          description={
            search || status || assetCategory
              ? "No jobs matched your current search and filter criteria. Try resetting filters."
              : "No valuation jobs created yet. Click 'New Valuation Job' to begin an assignment."
          }
          action={
            <Button asChild>
              <Link href="/jobs/new">Create Valuation Job</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Reference</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Category / Purpose</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Responsible Valuer</TableHead>
                <TableHead>Parcels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs font-semibold text-brand">
                    <Link href={`/jobs/${job.id}`} className="hover:underline">
                      {job.jobReference}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${job.client.id}`} className="font-medium hover:underline">
                      {job.client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge tone="neutral" className="mb-0.5">
                      {job.assetCategory}
                    </Badge>
                    <div className="text-muted-foreground line-clamp-1">{job.purpose}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                    {job.location}
                  </TableCell>
                  <TableCell className="text-xs">{job.valuer?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge tone="muted">{job.parcels?.length ?? 0} plot(s)</Badge>
                  </TableCell>
                  <TableCell>
                    <JobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/jobs/${job.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={`/jobs?page=${page - 1}&search=${encodeURIComponent(search)}`}>
                    Previous
                  </Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`/jobs?page=${page + 1}&search=${encodeURIComponent(search)}`}>
                    Next
                  </Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
