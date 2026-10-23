import "server-only";

import type { AssetCategory, JobStatus, Prisma } from "@prisma/client";
import { assertValidJobTransition } from "@/lib/domain/job-status-machine";
import type { SessionUser } from "@/lib/types";
import type { CreateJobInput, ParcelInput } from "@/lib/validation/job";
import {
  assertCanDeliverReport,
  assertCanEditJob,
  assertCanReviewReport,
} from "@/server/auth/authorize";
import { logAuditEvent } from "@/server/services/audit";
import { generateJobReference } from "@/server/services/reference-generator";
import { prisma } from "@/server/db/prisma";

export interface ListJobsOptions {
  search?: string;
  status?: JobStatus;
  assetCategory?: AssetCategory;
  valuerId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export async function listJobs(options: ListJobsOptions = {}) {
  const { search, status, assetCategory, valuerId, clientId, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.ValuationJobWhereInput = {
    isArchived: false,
    ...(status ? { status } : {}),
    ...(assetCategory ? { assetCategory } : {}),
    ...(valuerId ? { valuerId } : {}),
    ...(clientId ? { clientId } : {}),
    ...(search
      ? {
          OR: [
            { jobReference: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
            { purpose: { contains: search, mode: "insensitive" } },
            { borrowerName: { contains: search, mode: "insensitive" } },
            { client: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.valuationJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        client: { select: { id: true, name: true, reference: true } },
        valuer: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        parcels: { select: { id: true, parcelIdentifier: true, marketValue: true, landAreaAcres: true } },
      },
    }),
    prisma.valuationJob.count({ where }),
  ]);

  return {
    jobs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getJobById(id: string) {
  return prisma.valuationJob.findUnique({
    where: { id },
    include: {
      client: true,
      valuer: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true, email: true } },
      parcels: { orderBy: { createdAt: "asc" } },
      inspections: {
        orderBy: { createdAt: "desc" },
        include: { inspector: { select: { id: true, name: true } } },
      },
      mediaFiles: { orderBy: { createdAt: "desc" } },
      evidence: { orderBy: { createdAt: "desc" } },
      worksheet: {
        include: {
          lineItems: { orderBy: { orderIndex: "asc" } },
          preparedBy: { select: { id: true, name: true } },
        },
      },
      reportVersions: {
        orderBy: { versionNumber: "desc" },
        include: { createdBy: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createJob(data: CreateJobInput, user: SessionUser) {
  return prisma.$transaction(async (tx) => {
    const jobReference = await generateJobReference(tx);

    const job = await tx.valuationJob.create({
      data: {
        jobReference,
        clientId: data.clientId,
        assetCategory: data.assetCategory,
        purpose: data.purpose,
        location: data.location,
        currency: data.currency,
        valuerId: data.valuerId,
        reviewerId: data.reviewerId || null,

        instructionDate: data.instructionDate ? new Date(data.instructionDate) : new Date(),
        valuationDate: data.valuationDate ? new Date(data.valuationDate) : null,
        inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,

        borrowerName: data.borrowerName || null,
        clientContact: data.clientContact || null,
        inspectedInPresenceOf: data.inspectedInPresenceOf || null,
        distanceFromTarmac: data.distanceFromTarmac || null,
        accessDirections: data.accessDirections || null,
        neighborhoodNotes: data.neighborhoodNotes || null,
        environmentalNotes: data.environmentalNotes || null,
        encumbrancesNotes: data.encumbrancesNotes || null,
        highestBestUse: data.highestBestUse || null,
        suitabilityForLending: data.suitabilityForLending || null,
        specialRemarks: data.specialRemarks || null,
        notes: data.notes || null,
      },
    });

    await logAuditEvent(
      {
        actorId: user.id,
        action: "JOB_CREATED",
        entityType: "ValuationJob",
        entityId: job.id,
        changeSummary: { jobReference, purpose: job.purpose, location: job.location },
      },
      tx,
    );

    return job;
  });
}

export async function updateJob(
  id: string,
  data: Partial<CreateJobInput>,
  user: SessionUser,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.valuationJob.findUniqueOrThrow({ where: { id } });
    assertCanEditJob(user, existing);

    const updated = await tx.valuationJob.update({
      where: { id },
      data: {
        purpose: data.purpose ?? existing.purpose,
        location: data.location ?? existing.location,
        currency: data.currency ?? existing.currency,
        valuerId: data.valuerId ?? existing.valuerId,
        reviewerId: data.reviewerId !== undefined ? data.reviewerId || null : existing.reviewerId,
        valuationDate: data.valuationDate !== undefined ? (data.valuationDate ? new Date(data.valuationDate) : null) : existing.valuationDate,
        inspectionDate: data.inspectionDate !== undefined ? (data.inspectionDate ? new Date(data.inspectionDate) : null) : existing.inspectionDate,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : existing.dueDate,
        borrowerName: data.borrowerName !== undefined ? data.borrowerName || null : existing.borrowerName,
        clientContact: data.clientContact !== undefined ? data.clientContact || null : existing.clientContact,
        inspectedInPresenceOf: data.inspectedInPresenceOf !== undefined ? data.inspectedInPresenceOf || null : existing.inspectedInPresenceOf,
        distanceFromTarmac: data.distanceFromTarmac !== undefined ? data.distanceFromTarmac || null : existing.distanceFromTarmac,
        accessDirections: data.accessDirections !== undefined ? data.accessDirections || null : existing.accessDirections,
        neighborhoodNotes: data.neighborhoodNotes !== undefined ? data.neighborhoodNotes || null : existing.neighborhoodNotes,
        environmentalNotes: data.environmentalNotes !== undefined ? data.environmentalNotes || null : existing.environmentalNotes,
        encumbrancesNotes: data.encumbrancesNotes !== undefined ? data.encumbrancesNotes || null : existing.encumbrancesNotes,
        highestBestUse: data.highestBestUse !== undefined ? data.highestBestUse || null : existing.highestBestUse,
        suitabilityForLending: data.suitabilityForLending !== undefined ? data.suitabilityForLending || null : existing.suitabilityForLending,
        specialRemarks: data.specialRemarks !== undefined ? data.specialRemarks || null : existing.specialRemarks,
        notes: data.notes !== undefined ? data.notes || null : existing.notes,
      },
    });

    await logAuditEvent(
      {
        actorId: user.id,
        action: "JOB_UPDATED",
        entityType: "ValuationJob",
        entityId: id,
        changeSummary: { jobReference: updated.jobReference },
      },
      tx,
    );

    return updated;
  });
}

export async function transitionJobStatus(
  jobId: string,
  newStatus: JobStatus,
  user: SessionUser,
  reason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.valuationJob.findUniqueOrThrow({ where: { id: jobId } });

    // 1. Validate status machine transition
    assertValidJobTransition(job.status, newStatus);

    // 2. Role authorizations for specific targets
    if (newStatus === "APPROVED") {
      assertCanReviewReport(user, job);
    } else if (newStatus === "DELIVERED") {
      assertCanDeliverReport(user);
    }

    const updated = await tx.valuationJob.update({
      where: { id: jobId },
      data: {
        status: newStatus,
        cancelledReason: newStatus === "CANCELLED" ? reason || "Cancelled by user" : job.cancelledReason,
      },
    });

    await logAuditEvent(
      {
        actorId: user.id,
        action: "JOB_STATUS_CHANGED",
        entityType: "ValuationJob",
        entityId: jobId,
        changeSummary: { from: job.status, to: newStatus, reason },
      },
      tx,
    );

    return updated;
  });
}

export async function addParcelToJob(jobId: string, data: ParcelInput, user: SessionUser) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.valuationJob.findUniqueOrThrow({ where: { id: jobId } });
    assertCanEditJob(user, job);

    const parcel = await tx.assetParcel.create({
      data: {
        jobId,
        parcelIdentifier: data.parcelIdentifier,
        registeredOwner: data.registeredOwner || null,
        ownerNIN: data.ownerNIN || null,
        titleReference: data.titleReference || null,
        tenure: data.tenure,
        gpsCoordinates: data.gpsCoordinates || null,
        landAreaHectares: data.landAreaHectares ?? null,
        landAreaAcres: data.landAreaAcres ?? null,
        netUsableArea: data.netUsableArea || null,
        plotCoverage: data.plotCoverage || null,
        boundaryDefinition: data.boundaryDefinition || null,
        currentUse: data.currentUse || null,
        zoning: data.zoning || null,
        developments: data.developments || null,
        parkingCapacity: data.parkingCapacity || null,
        occupancyTenancy: data.occupancyTenancy || null,
        appliedRatePerAcre: data.appliedRatePerAcre ?? null,
        marketValue: data.marketValue ?? 0,
        forcedSaleValue: data.forcedSaleValue ?? 0,
        insuranceValue: data.insuranceValue ?? 0,
        valueInWords: data.valueInWords || null,
      },
    });

    await logAuditEvent(
      {
        actorId: user.id,
        action: "PARCEL_ADDED",
        entityType: "AssetParcel",
        entityId: parcel.id,
        changeSummary: { jobId, parcelIdentifier: parcel.parcelIdentifier },
      },
      tx,
    );

    return parcel;
  });
}
