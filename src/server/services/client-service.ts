import "server-only";

import type { ClientInput } from "@/lib/validation/client";
import { logAuditEvent } from "@/server/services/audit";
import { generateClientReference } from "@/server/services/reference-generator";
import { prisma } from "@/server/db/prisma";

export interface ListClientsOptions {
  search?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

export async function listClients(options: ListClientsOptions = {}) {
  const { search, page = 1, limit = 20, includeArchived = false } = options;
  const skip = (page - 1) * limit;

  const where: import("@prisma/client").Prisma.ClientWhereInput = {
    ...(includeArchived ? {} : { isArchived: false }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { reference: { contains: search, mode: "insensitive" } },
            { contactPerson: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        include: {
          valuer: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function createClient(data: ClientInput, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const reference = await generateClientReference(tx);

    const client = await tx.client.create({
      data: {
        reference,
        clientType: data.clientType,
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
      },
    });

    await logAuditEvent(
      {
        actorId,
        action: "CLIENT_CREATED",
        entityType: "Client",
        entityId: client.id,
        changeSummary: { reference, name: client.name, clientType: client.clientType },
      },
      tx,
    );

    return client;
  });
}

export async function updateClient(id: string, data: Partial<ClientInput>, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.client.findUniqueOrThrow({ where: { id } });

    const updated = await tx.client.update({
      where: { id },
      data: {
        clientType: data.clientType ?? existing.clientType,
        name: data.name ?? existing.name,
        contactPerson: data.contactPerson !== undefined ? data.contactPerson : existing.contactPerson,
        email: data.email !== undefined ? data.email || null : existing.email,
        phone: data.phone !== undefined ? data.phone || null : existing.phone,
        address: data.address !== undefined ? data.address || null : existing.address,
        notes: data.notes !== undefined ? data.notes || null : existing.notes,
      },
    });

    await logAuditEvent(
      {
        actorId,
        action: "CLIENT_UPDATED",
        entityType: "Client",
        entityId: id,
        changeSummary: { name: updated.name },
      },
      tx,
    );

    return updated;
  });
}

export async function archiveClient(id: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const archived = await tx.client.update({
      where: { id },
      data: { isArchived: true },
    });

    await logAuditEvent(
      {
        actorId,
        action: "CLIENT_ARCHIVED",
        entityType: "Client",
        entityId: id,
        changeSummary: { reference: archived.reference },
      },
      tx,
    );

    return archived;
  });
}
