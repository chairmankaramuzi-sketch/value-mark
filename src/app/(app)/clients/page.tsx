import Link from "next/link";
import { Plus, Search, UserCheck } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/server/auth/session";
import { listClients } from "@/server/services/client-service";

interface ClientsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  await requireUser();
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;

  let clientsData = { clients: [] as any[], total: 0, page: 1, limit: 20, totalPages: 1 };
  let errorMsg = null;

  try {
    clientsData = await listClients({ search, page, limit: 15 });
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : "Database connection issue.";
  }

  const { clients, total, totalPages } = clientsData;

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Individual and organisation clients requesting valuation instructions."
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Clients" }]}
        actions={
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="size-4" aria-hidden="true" />
              Register Client
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form method="GET" className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search by name, ref, or email…"
            className="pl-9"
          />
        </form>
        <p className="text-xs text-muted-foreground">
          Showing {clients.length} of {total} client{total === 1 ? "" : "s"}
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
      ) : clients.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No clients found"
          description={
            search
              ? `No registered clients matched '${search}'. Try adjusting your search query.`
              : "No clients registered yet. Click 'Register Client' to add your first client."
          }
          action={
            <Button asChild>
              <Link href="/clients/new">Register Client</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone / Email</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-mono text-xs font-semibold text-brand">
                    {client.reference}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge tone={client.clientType === "ORGANIZATION" ? "info" : "neutral"}>
                      {client.clientType === "ORGANIZATION" ? "Organisation" : "Individual"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.contactPerson || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{client.phone || "—"}</div>
                    <div>{client.email || ""}</div>
                  </TableCell>
                  <TableCell>
                    <Badge tone="muted">{client._count?.jobs ?? 0} jobs</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/clients/${client.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`/clients?page=${page - 1}&search=${encodeURIComponent(search)}`}>
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
                  <Link href={`/clients?page=${page + 1}&search=${encodeURIComponent(search)}`}>
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
