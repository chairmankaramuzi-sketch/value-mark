import { notFound } from "next/navigation";
import Link from "next/link";
import { Archive, Briefcase, Mail, MapPin, Phone, Plus, User } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { JobStatusBadge } from "@/components/common/states";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/server/auth/session";
import { getClientById } from "@/server/services/client-service";
import { archiveClientAction } from "@/server/actions/client-actions";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  await requireUser();
  const { id } = await params;

  let client = null;
  try {
    client = await getClientById(id);
  } catch {
    // Database connection issue
  }

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={`Client Reference: ${client.reference}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Clients", href: "/clients" },
          { label: client.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/jobs/new?clientId=${client.id}`}>
                <Plus className="size-4" aria-hidden="true" />
                New Job for this Client
              </Link>
            </Button>
            <form action={archiveClientAction.bind(null, client.id)}>
              <Button variant="danger" size="sm" type="submit">
                <Archive className="size-4" aria-hidden="true" />
                Archive Client
              </Button>
            </form>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contact Details</CardTitle>
              <Badge tone={client.clientType === "ORGANIZATION" ? "info" : "neutral"}>
                {client.clientType === "ORGANIZATION" ? "Organisation" : "Individual"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {client.contactPerson && (
              <div className="flex items-start gap-3">
                <User className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="font-medium text-foreground">{client.contactPerson}</p>
                </div>
              </div>
            )}

            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a href={`tel:${client.phone}`} className="font-medium text-brand hover:underline">
                    {client.phone}
                  </a>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a href={`mailto:${client.email}`} className="font-medium text-brand hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-foreground">{client.address}</p>
                </div>
              </div>
            )}

            {client.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Valuation Jobs</CardTitle>
                <CardDescription>All assignments registered for {client.name}</CardDescription>
              </div>
              <Badge tone="muted">{client.jobs.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {client.jobs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                <Briefcase className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                No valuation jobs created for this client yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Valuer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs font-semibold text-brand">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.jobReference}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{job.purpose}</TableCell>
                      <TableCell className="text-muted-foreground">{job.valuer.name}</TableCell>
                      <TableCell>
                        <JobStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/jobs/${job.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
