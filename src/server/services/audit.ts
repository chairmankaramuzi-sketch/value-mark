import "server-only";

import { prisma } from "@/server/db/prisma";
import type { Prisma } from "@prisma/client";

export interface LogAuditInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changeSummary?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Append-only audit logger.
 * Never throws an error that interrupts the main transaction; logs cleanly.
 */
export async function logAuditEvent(
  input: LogAuditInput,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const db = tx ?? prisma;
  try {
    await db.auditEvent.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        changeSummary: input.changeSummary as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    // Audit failure should be logged to stderr rather than breaking production flow
    console.error("Failed to append audit event:", error);
  }
}
