import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  FileText,
  Phone,
  Shield,
  User,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { JobStatusBadge } from "@/components/common/states";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/server/auth/session";
import { getJobById } from "@/server/services/job-service";

import { AddParcelDialog } from "./add-parcel-dialog";
import { StatusActions } from "./status-actions";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  await requireUser();
  const { id } = await params;

  let job = null;
  try {
    job = await getJobById(id);
  } catch {
    // Database connection issue
  }

  if (!job) {
    notFound();
  }

  // Calculate totals across parcels
  const totalMarketValue = job.parcels.reduce(
    (sum: number, p: { marketValue?: unknown }) => sum + Number(p.marketValue || 0),
    0,
  );
  const totalForcedSaleValue = job.parcels.reduce(
    (sum: number, p: { forcedSaleValue?: unknown }) => sum + Number(p.forcedSaleValue || 0),
    0,
  );
  const totalAcres = job.parcels.reduce(
    (sum: number, p: { landAreaAcres?: unknown }) => sum + Number(p.landAreaAcres || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.jobReference}
        description={`${job.purpose} — ${job.location}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Valuation Jobs", href: "/jobs" },
          { label: job.jobReference },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            <StatusActions jobId={job.id} currentStatus={job.status} />
          </div>
        }
      />

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Instruction & Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Client &amp; Parties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Instructing Client</p>
              <Link
                href={`/clients/${job.client.id}`}
                className="font-medium text-brand hover:underline"
              >
                {job.client.name}
              </Link>
            </div>
            {job.borrowerName && (
              <div>
                <p className="text-xs text-muted-foreground">Borrower / Owner</p>
                <p className="font-medium text-foreground">{job.borrowerName}</p>
              </div>
            )}
            {job.clientContact && (
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-muted-foreground" />
                <span className="text-xs">{job.clientContact}</span>
              </div>
            )}
            {job.inspectedInPresenceOf && (
              <div>
                <p className="text-xs text-muted-foreground">Inspected In Presence Of</p>
                <p className="text-xs text-foreground">{job.inspectedInPresenceOf}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff & Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Surveyors Assigned</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Responsible Valuer</p>
                <p className="font-medium text-foreground">{job.valuer.name}</p>
                <p className="text-xs text-muted-foreground">{job.valuer.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Shield className="mt-0.5 size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Reviewer / Approver</p>
                <p className="font-medium text-foreground">
                  {job.reviewer?.name || "Not assigned yet"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Instruction Date:</span>
              <span className="font-medium">
                {new Date(job.instructionDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Inspection Date:</span>
              <span className="font-medium">
                {job.inspectionDate
                  ? new Date(job.inspectionDate).toLocaleDateString()
                  : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Date of Valuation:</span>
              <span className="font-medium">
                {job.valuationDate
                  ? new Date(job.valuationDate).toLocaleDateString()
                  : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-medium text-brand">
                {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Land Parcels / Plots Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Subject Property Parcels &amp; Values</CardTitle>
              <CardDescription>
                Plots included under this valuation instruction with per-parcel acreage and assessed values.
              </CardDescription>
            </div>
            <AddParcelDialog jobId={job.id} />
          </div>
        </CardHeader>
        <CardContent>
          {job.parcels.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No land plots or parcels added yet. Click &quot;Add Parcel / Plot&quot; to add Plot 304 or untitled parcels.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcel / Plot</TableHead>
                    <TableHead>Title Reference &amp; Tenure</TableHead>
                    <TableHead>Size (Acres)</TableHead>
                    <TableHead>Rate / Acre</TableHead>
                    <TableHead>Market Value ({job.currency})</TableHead>
                    <TableHead>Forced Sale Value ({job.currency})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {job.parcels.map((parcel) => (
                    <TableRow key={parcel.id}>
                      <TableCell className="font-semibold text-foreground">
                        {parcel.parcelIdentifier}
                        {parcel.gpsCoordinates && (
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {parcel.gpsCoordinates}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{parcel.titleReference || "Untitled / Kibanja"}</div>
                        <Badge tone="neutral" className="mt-0.5">
                          {parcel.tenure}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {parcel.landAreaAcres ? `${Number(parcel.landAreaAcres)} ac` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {parcel.appliedRatePerAcre
                          ? Number(parcel.appliedRatePerAcre).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {Number(parcel.marketValue).toLocaleString()}/=
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {Number(parcel.forcedSaleValue).toLocaleString()}/=
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Summary Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Total Assessed Value</TableCell>
                    <TableCell className="font-mono text-xs">{totalAcres.toFixed(3)} ac</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="font-mono text-sm text-brand font-bold">
                      {totalMarketValue.toLocaleString()}/=
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold text-muted-foreground">
                      {totalForcedSaleValue.toLocaleString()}/=
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Narrative & Location Details */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Compass className="size-4 text-brand" />
              Location &amp; Access Directions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-foreground">Site Address:</p>
              <p className="text-muted-foreground">{job.location}</p>
            </div>
            {job.distanceFromTarmac && (
              <div>
                <p className="font-semibold text-foreground">Distance from Main Road:</p>
                <p className="text-muted-foreground">{job.distanceFromTarmac}</p>
              </div>
            )}
            {job.accessDirections && (
              <div>
                <p className="font-semibold text-foreground">Turn-by-turn Access Route:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.accessDirections}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="size-4 text-brand" />
              Observations &amp; Due Diligence Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-foreground">Encumbrance Search:</p>
              <p className="text-muted-foreground">
                {job.encumbrancesNotes || "Ministry of Lands Zonal Office search recorded."}
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Environmental Considerations:</p>
              <p className="text-muted-foreground">
                {job.environmentalNotes || "No visible adverse environmental factors at inspection."}
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Highest &amp; Best Use:</p>
              <p className="text-muted-foreground">
                {job.highestBestUse || "Residential / Agricultural use deemed highest and best use."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
