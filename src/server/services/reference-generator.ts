import "server-only";

import { prisma } from "@/server/db/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Atomic reference generator using sequence counter in the database.
 * Safe against race conditions under concurrent requests.
 */
export async function getNextSequenceNumber(
  sequenceKey: string,
  tx?: Prisma.TransactionClient,
): Promise<number> {
  const db = tx ?? prisma;

  const sequence = await db.referenceSequence.upsert({
    where: { sequenceKey },
    create: { sequenceKey, currentNumber: 1 },
    update: { currentNumber: { increment: 1 } },
  });

  return sequence.currentNumber;
}

/** Generates atomic unique client reference e.g. "CLI-2026-0001" */
export async function generateClientReference(
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await getNextSequenceNumber(`CLIENT_${year}`, tx);
  const padded = String(seq).padStart(4, "0");
  return `CLI-${year}-${padded}`;
}

/** Generates atomic unique job reference e.g. "VM-2026-0001" */
export async function generateJobReference(
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await getNextSequenceNumber(`JOB_${year}`, tx);
  const padded = String(seq).padStart(4, "0");
  return `VM-${year}-${padded}`;
}

/** Generates atomic unique report reference e.g. "RPT-2026-0001" */
export async function generateReportReference(
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await getNextSequenceNumber(`REPORT_${year}`, tx);
  const padded = String(seq).padStart(4, "0");
  return `RPT-${year}-${padded}`;
}
